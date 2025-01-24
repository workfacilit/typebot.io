import type { Block, SessionState, ChatSession } from '@typebot.io/schemas'
import type {
  WhatsAppCredentials,
  WhatsAppIncomingMessage,
} from '@typebot.io/schemas/features/whatsapp'
import { env } from '@typebot.io/env'
import { sendChatReplyToWhatsApp } from './sendChatReplyToWhatsApp'
import { startWhatsAppSession } from './startWhatsAppSession'
import { getSession } from '@typebot.io/bot-engine/queries/getSession'
import { continueBotFlow } from '@typebot.io/bot-engine/continueBotFlow'
import { decrypt } from '@typebot.io/lib/api/encryption/decrypt'
import { saveStateToDatabase } from '@typebot.io/bot-engine/saveStateToDatabase'
import prisma from '@typebot.io/lib/prisma'
import { isDefined } from '@typebot.io/lib/utils'
import type { Reply } from '@typebot.io/bot-engine/types'
import { setIsReplyingInChatSession } from '@typebot.io/bot-engine/queries/setIsReplyingInChatSession'
import { removeIsReplyingInChatSession } from '@typebot.io/bot-engine/queries/removeIsReplyingInChatSession'
import redis from '@typebot.io/lib/redis'
import { downloadMedia } from './downloadMedia'
import { InputBlockType } from '@typebot.io/schemas/features/blocks/inputs/constants'
import { uploadFileToBucket } from '@typebot.io/lib/s3/uploadFileToBucket'
import { getBlockById } from '@typebot.io/schemas/helpers'
import { sendLogRequest } from '@typebot.io/bot-engine/logWF'
import { logMessage } from '@typebot.io/bot-engine/queries/saveMessageLog'
import { parseGroups } from '@typebot.io/schemas'
import { LogicBlockType } from '@typebot.io/schemas/features/blocks/logic/constants'
import { scheduleMyQueueResumeWhatsAppFlow } from './queue/workers/scheduleMyQueueResumeWhatsAppFlow'

const incomingMessageDebounce = 3000

export type Props = {
  receivedMessage: WhatsAppIncomingMessage
  sessionId: string
  credentialsId?: string
  phoneNumberId?: string
  workspaceId?: string
  contact?: NonNullable<SessionState['whatsApp']>['contact']
  origin?: 'webhook'
  transitionBlock?: boolean
  transitionData?: object
}

const isMessageTooOld = (receivedMessage: WhatsAppIncomingMessage) => {
  const messageSendDate = new Date(Number(receivedMessage.timestamp) * 1000)
  return messageSendDate.getTime() < Date.now() - 180000
}

export const resumeWhatsAppFlow = async (props: Props) => {
  const {
    receivedMessage,
    sessionId,
    workspaceId,
    credentialsId,
    phoneNumberId,
    contact,
    origin,
    transitionBlock,
    transitionData,
  } = props

  const isPreview = workspaceId === undefined || credentialsId === undefined

  const credentials = await getCredentials({ credentialsId, isPreview })

  if (!credentials) {
    console.error('Could not find credentials')
    return
  }

  if (credentials.phoneNumberId !== phoneNumberId && !isPreview) {
    console.error('Credentials point to another phone ID, skipping...')
    return
  }

  const session = await getSession(sessionId)

  const aggregationResponse =
    await aggregateParallelMediaMessagesIfRedisEnabled({
      receivedMessage,
      existingSessionId: session?.id,
      newSessionId: sessionId,
    })

  if (aggregationResponse.status === 'found newer message') {
    console.log('Found newer message, skipping this one')
    return
  }

  const isSessionExpired =
    session &&
    isDefined(session.state.expiryTimeout) &&
    session?.updatedAt.getTime() + session.state.expiryTimeout < Date.now()

  if (aggregationResponse.status === 'treat as unique message') {
    if (session?.isReplying && origin !== 'webhook') {
      if (!isSessionExpired) {
        console.log('Is currently replying, skipping...')
        return
      }
    } else {
      await setIsReplyingInChatSession({
        existingSessionId: session?.id,
        newSessionId: sessionId,
      })
    }
  }

  const currentTypebot = session?.state.typebotsQueue[0].typebot
  const { block } =
    (currentTypebot && session?.state.currentBlockId
      ? getBlockById(session.state.currentBlockId, currentTypebot.groups)
      : undefined) ?? {}

  const reply = await convertWhatsAppMessageToTypebotMessage({
    messages: aggregationResponse.incomingMessages,
    workspaceId,
    accessToken: credentials?.systemUserAccessToken,
    typebotId: currentTypebot?.id,
    resultId: session?.state.typebotsQueue[0].resultId,
    block,
  })

  // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
  let resumeResponse

  if (
    reply?.type === 'text' &&
    (reply.text === '/sair' || reply.text === '/nps') &&
    workspaceId
  ) {
    resumeResponse = workspaceId
      ? await startWhatsAppSession({
          incomingMessage: reply,
          workspaceId,
          credentials: { ...credentials, id: credentialsId as string },
          contact,
        })
      : { error: 'workspaceId not found' }

    if ('error' in resumeResponse) {
      await removeIsReplyingInChatSession(sessionId)
      console.log('Chat not starting:', resumeResponse.error)
      return {
        message: 'Message received',
      }
    }
  } else {
    resumeResponse =
      session && !isSessionExpired
        ? await continueBotFlow(
            reply,
            {
              version: 2,
              state: { ...session.state, whatsApp: { contact } },
              textBubbleContentFormat: 'richText',
            },
            transitionBlock,
            transitionData as { typebotId: string; groupId: string }
          )
        : workspaceId
        ? await startWhatsAppSession({
            incomingMessage: reply,
            workspaceId,
            credentials: { ...credentials, id: credentialsId as string },
            contact,
          })
        : { error: 'workspaceId not found' }

    // await sendLogRequest('resumeWhatsAppFlow@resumeResponse', resumeResponse)

    if ('error' in resumeResponse) {
      await removeIsReplyingInChatSession(sessionId)
      console.log('Chat not starting:', resumeResponse.error)
      return {
        message: 'Message received',
      }
    }
  }

  const {
    input,
    logs,
    newSessionState,
    messages,
    clientSideActions,
    visitedEdges,
    setVariableHistory,
  } = resumeResponse

  const typebotId =
    currentTypebot?.id ?? newSessionState.typebotsQueue[0].typebot.id

  const resultId =
    session?.state.typebotsQueue[0].resultId ??
    newSessionState.typebotsQueue[0].resultId

  const resultIdWA = resultId ?? receivedMessage.from

  if (workspaceId && resultIdWA) {
    try {
      await logMessage(
        workspaceId,
        typebotId,
        'inbound',
        resultIdWA,
        reply?.type === 'text'
          ? reply.text
          : reply?.type === 'audio'
          ? reply.url
          : // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            (reply as any)?.attachedFileUrls ?? [],
        receivedMessage.from,
        'whatsapp'
      )
    } catch (error) {
      await sendLogRequest('errorLogMessage@resumeWhatsAppFlow', error)
    }
  }

  const isFirstChatChunk = (!session || isSessionExpired) ?? false
  await sendChatReplyToWhatsApp({
    to: receivedMessage.from,
    messages,
    input,
    isFirstChatChunk,
    typingEmulation: newSessionState.typingEmulation,
    clientSideActions,
    credentials,
    state: newSessionState,
    workspaceId,
    resultIdWA,
    typebotId,
    transitionBlock,
    transitionData,
  })

  await saveStateToDatabase({
    clientSideActions: [],
    input,
    logs,
    session: {
      id: sessionId,
      state: {
        ...newSessionState,
        currentBlockId: !input ? undefined : newSessionState.currentBlockId,
      },
    },
    visitedEdges,
    setVariableHistory,
  })

  if (!(reply?.type === 'text' && reply.text === '/sair')) {
    // await sendLogRequest('props@resumeWhatsAppFlow', props)
    await scheduleTransitionBlock(
      resumeResponse.newSessionState.typebotsQueue[0].typebot,
      props,
      sessionId
    )
  }

  return {
    message: 'Message received',
  }
}

const convertWhatsAppMessageToTypebotMessage = async ({
  messages,
  workspaceId,
  accessToken,
  typebotId,
  resultId,
  block,
}: {
  messages: WhatsAppIncomingMessage[]
  workspaceId?: string
  accessToken: string
  typebotId?: string
  resultId?: string
  block?: Block
}): Promise<Reply> => {
  let text = ''
  const attachedFileUrls: string[] = []
  for (const message of messages) {
    switch (message.type) {
      case 'text': {
        if (text !== '') text += `\n\n${message.text.body}`
        else text = message.text.body
        break
      }
      case 'button': {
        if (text !== '') text += `\n\n${message.button.text}`
        else text = message.button.text
        break
      }
      case 'interactive': {
        if (text !== '') {
          if (
            message.interactive.type === 'button_reply' &&
            message.interactive.button_reply
          ) {
            text += `\n\n${message.interactive.button_reply.id}`
          } else if (
            message.interactive.type === 'list_reply' &&
            message.interactive.list_reply
          ) {
            text += `\n\n${message.interactive.list_reply.id}`
          }
        } else {
          if (
            message.interactive.type === 'button_reply' &&
            message.interactive.button_reply
          ) {
            text = message.interactive.button_reply.id
          } else if (
            message.interactive.type === 'list_reply' &&
            message.interactive.list_reply
          ) {
            text = message.interactive.list_reply.id
          }
        }
        break
      }
      case 'document':
      case 'audio':
      case 'video':
      case 'image': {
        let mediaId: string | undefined
        if (message.type === 'video') mediaId = message.video.id
        if (message.type === 'image') mediaId = message.image.id
        if (message.type === 'audio') mediaId = message.audio.id
        if (message.type === 'document') mediaId = message.document.id
        if (!mediaId) return

        try {
          const fileVisibility =
            block?.type === InputBlockType.TEXT &&
            block.options?.audioClip?.isEnabled &&
            message.type === 'audio'
              ? block.options?.audioClip.visibility
              : block?.type === InputBlockType.FILE
              ? block.options?.visibility
              : block?.type === InputBlockType.TEXT
              ? block.options?.attachments?.visibility
              : undefined
          // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
          let fileUrl
          if (fileVisibility !== 'Public') {
            fileUrl =
              env.NEXTAUTH_URL +
              `/api/typebots/${typebotId}/whatsapp/media/${
                workspaceId ? `` : 'preview/'
              }${mediaId}`
          } else {
            const { file, mimeType } = await downloadMedia({
              mediaId,
              systemUserAccessToken: accessToken,
            })
            const url = await uploadFileToBucket({
              file,
              key:
                resultId && workspaceId && typebotId
                  ? `public/workspaces/${workspaceId}/typebots/${typebotId}/results/${resultId}/${mediaId}`
                  : `tmp/whatsapp/media/${mediaId}`,
              mimeType,
            })
            fileUrl = url
          }
          if (message.type === 'audio')
            return {
              type: 'audio',
              url: fileUrl,
            }
          if (block?.type === InputBlockType.FILE) {
            if (text !== '') text += `, ${fileUrl}`
            else text = fileUrl
          } else if (block?.type === InputBlockType.TEXT) {
            let caption: string | undefined
            if (message.type === 'document' && message.document.caption) {
              if (!/^[\w,\s-]+\.[A-Za-z]{3}$/.test(message.document.caption))
                caption = message.document.caption
            } else if (message.type === 'image' && message.image.caption)
              caption = message.image.caption
            else if (message.type === 'video' && message.video.caption)
              caption = message.video.caption
            if (caption) text = text === '' ? caption : `${text}\n\n${caption}`
            attachedFileUrls.push(fileUrl)
          }
        } catch (error) {
          await sendLogRequest('errorMediaId@sendChatReplyToWhatsApp', error)
          text = ''
        }

        break
      }
      case 'location': {
        const location = `${message.location.latitude}, ${message.location.longitude}`
        if (text !== '') text += `\n\n${location}`
        else text = location
        break
      }
    }
  }

  return {
    type: 'text',
    text,
    attachedFileUrls,
  }
}

const getCredentials = async ({
  credentialsId,
  isPreview,
}: {
  credentialsId?: string
  isPreview: boolean
}): Promise<WhatsAppCredentials['data'] | undefined> => {
  if (isPreview) {
    if (
      !env.META_SYSTEM_USER_TOKEN ||
      !env.WHATSAPP_PREVIEW_FROM_PHONE_NUMBER_ID
    )
      return
    return {
      systemUserAccessToken: env.META_SYSTEM_USER_TOKEN,
      phoneNumberId: env.WHATSAPP_PREVIEW_FROM_PHONE_NUMBER_ID,
    }
  }

  if (!credentialsId) return

  const credentials = await prisma.credentials.findUnique({
    where: {
      id: credentialsId,
    },
    select: {
      data: true,
      iv: true,
    },
  })
  if (!credentials) return
  const data = (await decrypt(
    credentials.data,
    credentials.iv
  )) as WhatsAppCredentials['data']
  return {
    systemUserAccessToken: data.systemUserAccessToken,
    phoneNumberId: data.phoneNumberId,
  }
}

const aggregateParallelMediaMessagesIfRedisEnabled = async ({
  receivedMessage,
  existingSessionId,
  newSessionId,
}: {
  receivedMessage: WhatsAppIncomingMessage
  existingSessionId?: string
  newSessionId: string
}): Promise<
  | {
      status: 'treat as unique message'
      incomingMessages: [WhatsAppIncomingMessage]
    }
  | {
      status: 'found newer message'
    }
  | {
      status: 'ready to reply'
      incomingMessages: WhatsAppIncomingMessage[]
    }
> => {
  if (redis && ['document', 'video', 'image'].includes(receivedMessage.type)) {
    const redisKey = `wasession:${newSessionId}`
    try {
      const len = await redis.rpush(redisKey, JSON.stringify(receivedMessage))

      if (len === 1) {
        await setIsReplyingInChatSession({
          existingSessionId,
          newSessionId,
        })
      }

      await new Promise((resolve) =>
        setTimeout(resolve, incomingMessageDebounce)
      )

      const newMessagesResponse = await redis.lrange(redisKey, 0, -1)

      if (!newMessagesResponse || newMessagesResponse.length > len)
        return { status: 'found newer message' }

      redis.del(redisKey).then()

      return {
        status: 'ready to reply',
        incomingMessages: newMessagesResponse.map((msgStr) =>
          JSON.parse(msgStr)
        ),
      }
    } catch (error) {
      console.error('Failed to process webhook event:', error, receivedMessage)
    }
  }

  return {
    status: 'treat as unique message',
    incomingMessages: [receivedMessage],
  }
}

function hasScheduleOptions(block: Block): block is Block & {
  options: {
    schedule: {
      actived?: boolean
      minutes?: number
      typebotId?: string
      groupId?: string
    }
  }
} {
  return (
    'options' in block &&
    typeof block.options === 'object' &&
    'schedule' in block.options
  )
}

const scheduleTransitionBlock = async (
  typebot: NonNullable<SessionState['typebotsQueue'][0]['typebot']>,
  originalProps: Props,
  sessionId: string
) => {
  const session = await getSession(sessionId)
  const currentTypebot = session?.state.typebotsQueue[0].typebot
  if (!currentTypebot) {
    console.error('currentTypebot is undefined')
    return
  }
  const blocks = parseGroups(currentTypebot.groups, {
    typebotVersion: currentTypebot.version,
  })
    .flatMap((group): Block[] => group.blocks as Block[])
    .filter(
      (block) =>
        block.type === LogicBlockType.TYPEBOT_LINK &&
        hasScheduleOptions(block) &&
        block.options.schedule.actived &&
        (block.options.schedule.minutes ?? 0) > 0 &&
        (block.options.schedule.minutes ?? 0) < 60
    )
  await sendLogRequest('blocks@resumeWhatsAppFlow', currentTypebot)
  for (const block of blocks) {
    if (!hasScheduleOptions(block)) continue
    // await sendLogRequest(
    //   'session@resumeWhatsAppFlow',
    //   block.options.schedule.session
    // )
    scheduleMyQueueResumeWhatsAppFlow(
      sessionId,
      {
        ...originalProps,
        transitionBlock: true,
        transitionData: {
          typebotId: block.options.typebotId,
          groupId: block.options.groupId,
        },
      },
      block.options.schedule.minutes ?? 1
    )
  }
}
