import type {
  AnswerInSessionState,
  Block,
  ContinueChatResponse,
  Group,
  InputBlock,
  Message,
  SessionState,
  SetVariableHistoryItem,
  Variable,
} from '@typebot.io/schemas'
import { byId, isDefined } from '@typebot.io/lib'
import { isInputBlock } from '@typebot.io/schemas/helpers'
import { executeGroup, parseInput } from './executeGroup'
import { getNextGroup } from './getNextGroup'
import { formatEmail } from './blocks/inputs/email/formatEmail'
import { formatPhoneNumber } from './blocks/inputs/phone/formatPhoneNumber'
import { saveAnswer } from './queries/saveAnswer'
import { parseButtonsReply } from './blocks/inputs/buttons/parseButtonsReply'
import type { ParsedReply, Reply } from './types'
import { validateNumber } from './blocks/inputs/number/validateNumber'
import { parseDateReply } from './blocks/inputs/date/parseDateReply'
import { validateRatingReply } from './blocks/inputs/rating/validateRatingReply'
import { parsePictureChoicesReply } from './blocks/inputs/pictureChoice/parsePictureChoicesReply'
import { parseVariables } from '@typebot.io/variables/parseVariables'
import { updateVariablesInSession } from '@typebot.io/variables/updateVariablesInSession'
import { startBotFlow } from './startBotFlow'
import { TRPCError } from '@trpc/server'
import { parseNumber } from './blocks/inputs/number/parseNumber'
import { BubbleBlockType } from '@typebot.io/schemas/features/blocks/bubbles/constants'
import { InputBlockType } from '@typebot.io/schemas/features/blocks/inputs/constants'
import { defaultPaymentInputOptions } from '@typebot.io/schemas/features/blocks/inputs/payment/constants'
import { IntegrationBlockType } from '@typebot.io/schemas/features/blocks/integrations/constants'
import { LogicBlockType } from '@typebot.io/schemas/features/blocks/logic/constants'
import { defaultEmailInputOptions } from '@typebot.io/schemas/features/blocks/inputs/email/constants'
import { defaultChoiceInputOptions } from '@typebot.io/schemas/features/blocks/inputs/choice/constants'
import { defaultPictureChoiceOptions } from '@typebot.io/schemas/features/blocks/inputs/pictureChoice/constants'
import { defaultFileInputOptions } from '@typebot.io/schemas/features/blocks/inputs/file/constants'
import type { VisitedEdge } from '@typebot.io/prisma'
import { getBlockById } from '@typebot.io/schemas/helpers'
import type { ForgedBlock } from '@typebot.io/forge-repository/types'
import { forgedBlocks } from '@typebot.io/forge-repository/definitions'
import { resumeChatCompletion } from './blocks/integrations/legacy/openai/resumeChatCompletion'
import { env } from '@typebot.io/env'
import { isURL } from '@typebot.io/lib/validators/isURL'
import { stringifyError } from '@typebot.io/lib/stringifyError'
import { isForgedBlockType } from '@typebot.io/schemas/features/blocks/forged/helpers'
import { resetSessionState } from './resetSessionState'
import { saveDataInResponseVariableMapping } from './blocks/integrations/webhook/saveDataInResponseVariableMapping'
import { sendLogRequest } from './logWF'

type Params = {
  version: 1 | 2
  state: SessionState
  startTime?: number
  textBubbleContentFormat: 'richText' | 'markdown'
}
export const continueBotFlow = async (
  reply: Reply,
  { state, version, startTime, textBubbleContentFormat }: Params,
  transitionBlock?: boolean,
  transitionData?: { typebotId: string; groupId: string }
): Promise<
  ContinueChatResponse & {
    newSessionState: SessionState
    visitedEdges: VisitedEdge[]
    setVariableHistory: SetVariableHistoryItem[]
  }
> => {
  if (!state.currentBlockId)
    return startBotFlow({
      state: resetSessionState(state),
      version,
      textBubbleContentFormat,
    })

  const { block, group, blockIndex } = getBlockById(
    state.currentBlockId,
    state.typebotsQueue[0].typebot.groups
  )

  // await sendLogRequest('continueBotFlow@groups', group)

  if (!block)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Group / block not found',
    })

  const nonInputProcessResult = await processNonInputBlock({
    block,
    state,
    reply,
  })

  let newSessionState = nonInputProcessResult.newSessionState
  const { setVariableHistory, firstBubbleWasStreamed } = nonInputProcessResult

  let formattedReply: string | undefined

  const groupJump: Group = {
    id: 'smgababwob2lcnvtpz49hm9vasas',
    title: 'pular fluxo',
    graphCoordinates: {
      x: 302,
      y: 906,
    },
    blocks: [
      {
        id: 'tptcammmgde0zn592idlmdsbsas',
        type: LogicBlockType.TYPEBOT_LINK,
        options: {
          typebotId: transitionData?.typebotId,
          groupId: transitionData?.groupId,
          mergeResults: true,
        },
      },
    ],
  }

  // await sendLogRequest('continueBotFlow@transitionBlock', transitionBlock)
  if (!transitionBlock && !transitionData?.typebotId && isInputBlock(block)) {
    const parsedReplyResult = await parseReply(newSessionState)(reply, block)

    formattedReply =
      'reply' in parsedReplyResult && reply?.type === 'text'
        ? parsedReplyResult.reply
        : undefined

    if (parsedReplyResult.status === 'fail') {
      console.error('parsedReplyResult.status === fail')
      if (transitionBlock) {
        const lastMessageNewFormat =
          reply?.type === 'text' && formattedReply !== reply?.text
            ? formattedReply
            : undefined

        const chatReply = await executeGroup(groupJump, {
          version,
          state: newSessionState,
          firstBubbleWasStreamed,
          visitedEdges: [],
          setVariableHistory,
          startTime,
          textBubbleContentFormat,
        })

        return {
          ...chatReply,
          lastMessageNewFormat,
        }
      }
      return {
        ...(await parseRetryMessage(newSessionState)(
          block,
          textBubbleContentFormat
        )),
        newSessionState,
        visitedEdges: [],
        setVariableHistory: [],
      }
    }

    newSessionState = await processAndSaveAnswer(
      state,
      block
    )(
      isDefined(formattedReply)
        ? { ...reply, type: 'text', text: formattedReply }
        : reply
    )
  }

  const groupHasMoreBlocks = blockIndex < group.blocks.length - 1
  // await sendLogRequest(
  //   'continueBotFlow@groupsgroupHasMoreBlocks',
  //   groupHasMoreBlocks
  // )
  const { edgeId: nextEdgeId, isOffDefaultPath } = getOutgoingEdgeId(
    newSessionState
  )(block, formattedReply)

  const lastMessageNewFormat =
    reply?.type === 'text' && formattedReply !== reply?.text
      ? formattedReply
      : undefined

  if (groupHasMoreBlocks && !nextEdgeId) {
    const jumpToBlock =
      transitionBlock || transitionData?.typebotId ? groupJump : group
    const chatReply = await executeGroup(
      {
        ...jumpToBlock,
        blocks: group.blocks.slice(blockIndex + 1),
      } as Group,
      {
        version,
        state: newSessionState,
        visitedEdges: [],
        setVariableHistory,
        firstBubbleWasStreamed,
        startTime,
        textBubbleContentFormat,
      }
    )
    return {
      ...chatReply,
      lastMessageNewFormat,
    }
  }

  if (!nextEdgeId && state.typebotsQueue.length === 1) {
    // await sendLogRequest('continueBotFlow@!nextEdgeId', {
    //   nextEdgeId,
    // })

    if (transitionBlock) {
      const chatReply = await executeGroup(groupJump, {
        version,
        state: newSessionState,
        firstBubbleWasStreamed,
        visitedEdges: [],
        setVariableHistory,
        startTime,
        textBubbleContentFormat,
      })

      return {
        ...chatReply,
        lastMessageNewFormat,
      }
    }

    return {
      messages: [],
      newSessionState,
      lastMessageNewFormat,
      visitedEdges: [],
      setVariableHistory,
    }
  }

  const nextGroup = await getNextGroup({
    state: newSessionState,
    edgeId: nextEdgeId,
    isOffDefaultPath,
  })

  newSessionState = nextGroup.newSessionState

  if (!nextGroup.group) {
    // await sendLogRequest('continueBotFlow@!nextGroup.group', {
    //   nextEdgeId,
    // })
    if (transitionBlock) {
      const chatReply = await executeGroup(groupJump, {
        version,
        state: newSessionState,
        firstBubbleWasStreamed,
        visitedEdges: nextGroup.visitedEdge ? [nextGroup.visitedEdge] : [],
        setVariableHistory,
        startTime,
        textBubbleContentFormat,
      })

      return {
        ...chatReply,
        lastMessageNewFormat,
      }
    }

    return {
      messages: [],
      newSessionState,
      lastMessageNewFormat,
      visitedEdges: nextGroup.visitedEdge ? [nextGroup.visitedEdge] : [],
      setVariableHistory,
    }
  }

  const jumpToBlock =
    transitionBlock || transitionData?.typebotId ? groupJump : nextGroup.group

  // await sendLogRequest('continueBotFlow@jumpToBlock', jumpToBlock)

  const chatReply = await executeGroup(jumpToBlock, {
    version,
    state: newSessionState,
    firstBubbleWasStreamed,
    visitedEdges: nextGroup.visitedEdge ? [nextGroup.visitedEdge] : [],
    setVariableHistory,
    startTime,
    textBubbleContentFormat,
  })

  return {
    ...chatReply,
    lastMessageNewFormat,
  }
}

const processNonInputBlock = async ({
  block,
  state,
  reply,
}: {
  block: Block
  state: SessionState
  reply: Reply
}) => {
  if (reply?.type !== 'text')
    return {
      newSessionState: state,
      setVariableHistory: [],
      firstBubbleWasStreamed: false,
    }

  const setVariableHistory: SetVariableHistoryItem[] = []
  let variableToUpdate: Variable | undefined
  let newSessionState = state
  let firstBubbleWasStreamed = false

  if (block.type === LogicBlockType.SET_VARIABLE) {
    const existingVariable = state.typebotsQueue[0].typebot.variables.find(
      byId(block.options?.variableId)
    )
    if (existingVariable && reply) {
      variableToUpdate = {
        ...existingVariable,
      }
    }
  }
  // Legacy
  else if (
    block.type === IntegrationBlockType.OPEN_AI &&
    block.options?.task === 'Create chat completion'
  ) {
    firstBubbleWasStreamed = true
    if (reply) {
      const result = await resumeChatCompletion(state, {
        options: block.options,
        outgoingEdgeId: block.outgoingEdgeId,
      })(reply.text)
      newSessionState = result.newSessionState
    }
  } else if (
    reply &&
    (block.type === IntegrationBlockType.WEBHOOK ||
      block.type === LogicBlockType.WEBHOOK_REQUEST)
  ) {
    let response: {
      statusCode?: number
      data?: unknown
    }
    try {
      response = JSON.parse(reply.text)
    } catch (err) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Provided response is not valid JSON',
        cause: stringifyError(err),
      })
    }
    const result = saveDataInResponseVariableMapping({
      state,
      blockType: block.type,
      blockId: block.id,
      responseVariableMapping: block.options?.responseVariableMapping,
      outgoingEdgeId: block.outgoingEdgeId,
      response,
    })
    if (result.newSessionState) newSessionState = result.newSessionState
  } else if (isForgedBlockType(block.type)) {
    if (reply) {
      const options = (block as ForgedBlock).options
      const action = forgedBlocks[block.type].actions.find(
        (a) => a.name === options?.action
      )
      if (action) {
        if (action.run?.stream?.getStreamVariableId) {
          firstBubbleWasStreamed = true
          variableToUpdate = state.typebotsQueue[0].typebot.variables.find(
            (v) => v.id === action?.run?.stream?.getStreamVariableId(options)
          )
        }

        if (
          action.run?.web?.displayEmbedBubble?.waitForEvent?.getSaveVariableId
        ) {
          variableToUpdate = state.typebotsQueue[0].typebot.variables.find(
            (v) =>
              v.id ===
              action?.run?.web?.displayEmbedBubble?.waitForEvent?.getSaveVariableId?.(
                options
              )
          )
        }
      }
    }
  } else if (
    block.type === BubbleBlockType.EMBED &&
    block.content?.waitForEvent?.saveDataInVariableId
  ) {
    variableToUpdate = state.typebotsQueue[0].typebot.variables.find(
      (v) => v.id === block.content?.waitForEvent?.saveDataInVariableId
    )
  }

  if (variableToUpdate) {
    const { newSetVariableHistory, updatedState } = updateVariablesInSession({
      state: newSessionState,
      currentBlockId: block.id,
      newVariables: [
        {
          ...variableToUpdate,
          value: reply?.text ? safeJsonParse(reply?.text) : undefined,
        },
      ],
    })
    newSessionState = updatedState
    setVariableHistory.push(...newSetVariableHistory)
  }

  return {
    newSessionState,
    setVariableHistory,
    firstBubbleWasStreamed,
  }
}

const processAndSaveAnswer =
  (state: SessionState, block: InputBlock) =>
  async (reply: Message | undefined): Promise<SessionState> => {
    if (!reply) return state
    return saveAnswerInDb(state, block)(reply)
  }

const saveVariablesValueIfAny =
  (state: SessionState, block: InputBlock) =>
  (reply: Message): SessionState => {
    let newSessionState = saveAttachmentsVarIfAny({ block, reply, state })
    newSessionState = saveAudioClipVarIfAny({
      block,
      reply,
      state: newSessionState,
    })
    return saveInputVarIfAny({ block, reply, state: newSessionState })
  }

const saveAttachmentsVarIfAny = ({
  block,
  reply,
  state,
}: {
  block: InputBlock
  reply: Message
  state: SessionState
}): SessionState => {
  if (
    reply.type !== 'text' ||
    block.type !== InputBlockType.TEXT ||
    !block.options?.attachments?.isEnabled ||
    !block.options?.attachments?.saveVariableId ||
    !reply.attachedFileUrls ||
    reply.attachedFileUrls.length === 0
  )
    return state

  const variable = state.typebotsQueue[0].typebot.variables.find(
    (variable) => variable.id === block.options?.attachments?.saveVariableId
  )

  if (!variable) return state

  const { updatedState } = updateVariablesInSession({
    newVariables: [
      {
        id: variable.id,
        name: variable.name,
        value: Array.isArray(variable.value)
          ? variable.value.concat(reply.attachedFileUrls)
          : reply.attachedFileUrls.length === 1
          ? reply.attachedFileUrls[0]
          : reply.attachedFileUrls,
      },
    ],
    currentBlockId: undefined,
    state,
  })
  return updatedState
}

const saveAudioClipVarIfAny = ({
  block,
  reply,
  state,
}: {
  block: InputBlock
  reply: Message
  state: SessionState
}): SessionState => {
  if (
    reply.type !== 'audio' ||
    block.type !== InputBlockType.TEXT ||
    !block.options?.audioClip?.isEnabled ||
    !block.options?.audioClip?.saveVariableId
  )
    return state

  const variable = state.typebotsQueue[0].typebot.variables.find(
    (variable) => variable.id === block.options?.audioClip?.saveVariableId
  )

  if (!variable) return state

  const { updatedState } = updateVariablesInSession({
    newVariables: [
      {
        id: variable.id,
        name: variable.name,
        value: reply.url,
      },
    ],
    currentBlockId: undefined,
    state,
  })

  return updatedState
}

const saveInputVarIfAny = ({
  block,
  reply,
  state,
}: {
  block: InputBlock
  reply: Message
  state: SessionState
}): SessionState => {
  if (reply.type !== 'text' || !block.options?.variableId) return state

  const foundVariable = state.typebotsQueue[0].typebot.variables.find(
    (variable) => variable.id === block.options?.variableId
  )
  if (!foundVariable) return state

  const { updatedState } = updateVariablesInSession({
    newVariables: [
      {
        ...foundVariable,
        value:
          Array.isArray(foundVariable.value) && reply.text
            ? foundVariable.value.concat(reply.text)
            : reply.text,
      },
    ],
    currentBlockId: undefined,
    state,
  })

  return updatedState
}

const parseRetryMessage =
  (state: SessionState) =>
  async (
    block: InputBlock,
    textBubbleContentFormat: 'richText' | 'markdown'
  ): Promise<Pick<ContinueChatResponse, 'messages' | 'input'>> => {
    const retryMessage =
      block.options &&
      'retryMessageContent' in block.options &&
      block.options.retryMessageContent
        ? parseVariables(state.typebotsQueue[0].typebot.variables)(
            block.options.retryMessageContent
          )
        : parseDefaultRetryMessage(block)
    return {
      messages: [
        {
          id: block.id,
          type: BubbleBlockType.TEXT,
          content:
            textBubbleContentFormat === 'richText'
              ? {
                  type: 'richText',
                  richText: [{ type: 'p', children: [{ text: retryMessage }] }],
                }
              : {
                  type: 'markdown',
                  markdown: retryMessage,
                },
        },
      ],
      input: await parseInput(state)(block),
    }
  }

const parseDefaultRetryMessage = (block: InputBlock): string => {
  switch (block.type) {
    case InputBlockType.EMAIL:
      return defaultEmailInputOptions.retryMessageContent
    case InputBlockType.PAYMENT:
      return defaultPaymentInputOptions.retryMessageContent
    default:
      return 'Mensagem inválida. Por favor, tente novamente.'
  }
}

const saveAnswerInDb =
  (state: SessionState, block: InputBlock) =>
  async (reply: Message): Promise<SessionState> => {
    let newSessionState = state
    const replyContent = reply.type === 'audio' ? reply.url : reply.text
    const attachedFileUrls =
      reply.type === 'text' ? reply.attachedFileUrls : undefined
    await saveAnswer({
      answer: {
        blockId: block.id,
        content: replyContent,
        attachedFileUrls,
      },
      state,
    })

    newSessionState = {
      ...saveVariablesValueIfAny(newSessionState, block)(reply),
      previewMetadata: state.typebotsQueue[0].resultId
        ? newSessionState.previewMetadata
        : {
            ...newSessionState.previewMetadata,
            answers: (newSessionState.previewMetadata?.answers ?? []).concat({
              blockId: block.id,
              content: replyContent,
              attachedFileUrls,
            }),
          },
    }

    const key = block.options?.variableId
      ? newSessionState.typebotsQueue[0].typebot.variables.find(
          (variable) => variable.id === block.options?.variableId
        )?.name
      : parseGroupKey(block.id, { state: newSessionState })

    return setNewAnswerInState(newSessionState)({
      key: key ?? block.id,
      value:
        (attachedFileUrls ?? []).length > 0
          ? `${
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              attachedFileUrls!.join(', ')
            }\n\n${replyContent}`
          : replyContent,
    })
  }

const parseGroupKey = (blockId: string, { state }: { state: SessionState }) => {
  const group = state.typebotsQueue[0].typebot.groups.find((group) =>
    group.blocks.find((b) => b.id === blockId)
  )
  if (!group) return

  const inputBlockNumber = group.blocks
    .filter(isInputBlock)
    .findIndex((b) => b.id === blockId)

  return inputBlockNumber > 0
    ? `${group.title} (${inputBlockNumber})`
    : group?.title
}

const setNewAnswerInState =
  (state: SessionState) => (newAnswer: AnswerInSessionState) => {
    const answers = state.typebotsQueue[0].answers
    const newAnswers = answers
      .filter((answer) => answer.key !== newAnswer.key)
      .concat(newAnswer)

    return {
      ...state,
      progressMetadata: state.progressMetadata
        ? { totalAnswers: state.progressMetadata.totalAnswers + 1 }
        : undefined,
      typebotsQueue: state.typebotsQueue.map((typebot, index) =>
        index === 0
          ? {
              ...typebot,
              answers: newAnswers,
            }
          : typebot
      ),
    } satisfies SessionState
  }

const getOutgoingEdgeId =
  (state: Pick<SessionState, 'typebotsQueue'>) =>
  (
    block: Block,
    reply: string | undefined
  ): { edgeId: string | undefined; isOffDefaultPath: boolean } => {
    const variables = state.typebotsQueue[0].typebot.variables
    if (
      block.type === InputBlockType.CHOICE &&
      !(
        block.options?.isMultipleChoice ??
        defaultChoiceInputOptions.isMultipleChoice
      ) &&
      reply
    ) {
      const matchedItem = block.items.find(
        (item) =>
          parseVariables(variables)(item.content).normalize() ===
          reply.normalize()
      )
      if (matchedItem?.outgoingEdgeId)
        return { edgeId: matchedItem.outgoingEdgeId, isOffDefaultPath: true }
    }
    if (
      block.type === InputBlockType.PICTURE_CHOICE &&
      !(
        block.options?.isMultipleChoice ??
        defaultPictureChoiceOptions.isMultipleChoice
      ) &&
      reply
    ) {
      const matchedItem = block.items.find(
        (item) =>
          parseVariables(variables)(item.title).normalize() ===
          reply.normalize()
      )
      if (matchedItem?.outgoingEdgeId)
        return { edgeId: matchedItem.outgoingEdgeId, isOffDefaultPath: true }
    }
    return { edgeId: block.outgoingEdgeId, isOffDefaultPath: false }
  }

const parseReply =
  (state: SessionState) =>
  async (reply: Reply, block: InputBlock): Promise<ParsedReply> => {
    switch (block.type) {
      case InputBlockType.EMAIL: {
        if (!reply || reply.type !== 'text') return { status: 'fail' }
        const formattedEmail = formatEmail(reply.text)
        if (!formattedEmail) return { status: 'fail' }
        return { status: 'success', reply: formattedEmail }
      }
      case InputBlockType.PHONE: {
        if (!reply || reply.type !== 'text') return { status: 'fail' }
        const formattedPhone = formatPhoneNumber(
          reply.text,
          block.options?.defaultCountryCode
        )
        if (!formattedPhone) return { status: 'fail' }
        return { status: 'success', reply: formattedPhone }
      }
      case InputBlockType.URL: {
        if (!reply || reply.type !== 'text') return { status: 'fail' }
        const isValid = isURL(reply.text, { require_protocol: false })
        if (!isValid) return { status: 'fail' }
        return { status: 'success', reply: reply.text }
      }
      case InputBlockType.CHOICE: {
        if (!reply || reply.type !== 'text') return { status: 'fail' }
        return parseButtonsReply(state)(reply.text, block)
      }
      case InputBlockType.NUMBER: {
        if (!reply || reply.type !== 'text') return { status: 'fail' }
        const isValid = validateNumber(reply.text, {
          options: block.options,
          variables: state.typebotsQueue[0].typebot.variables,
        })
        if (!isValid) return { status: 'fail' }
        return { status: 'success', reply: parseNumber(reply.text) }
      }
      case InputBlockType.DATE: {
        if (!reply || reply.type !== 'text') return { status: 'fail' }
        return parseDateReply(reply.text, block)
      }
      case InputBlockType.FILE: {
        if (!reply)
          return block.options?.isRequired ?? defaultFileInputOptions.isRequired
            ? { status: 'fail' }
            : { status: 'skip' }
        const replyValue = reply.type === 'audio' ? reply.url : reply.text
        const urls = replyValue.split(', ')
        const status = urls.some((url) =>
          isURL(url, { require_tld: env.S3_ENDPOINT !== 'localhost' })
        )
          ? 'success'
          : 'fail'
        if (!block.options?.isMultipleAllowed && urls.length > 1)
          return { status, reply: replyValue.split(',')[0] }
        return { status, reply: replyValue }
      }
      case InputBlockType.PAYMENT: {
        if (!reply || reply.type !== 'text') return { status: 'fail' }
        if (reply.text === 'fail') return { status: 'fail' }
        return { status: 'success', reply: reply.text }
      }
      case InputBlockType.RATING: {
        if (!reply || reply.type !== 'text') return { status: 'fail' }
        const isValid = validateRatingReply(reply.text, block)
        if (!isValid) return { status: 'fail' }
        return { status: 'success', reply: reply.text }
      }
      case InputBlockType.PICTURE_CHOICE: {
        if (!reply || reply.type !== 'text') return { status: 'fail' }
        return parsePictureChoicesReply(state)(reply.text, block)
      }
      case InputBlockType.TEXT: {
        if (!reply) return { status: 'fail' }
        return {
          status: 'success',
          reply: reply.type === 'audio' ? reply.url : reply.text,
        }
      }
    }
  }

export const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
