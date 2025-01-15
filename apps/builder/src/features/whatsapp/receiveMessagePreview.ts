import { publicProcedure } from '@/helpers/server/trpc'
import { z } from 'zod'
import { resumeWhatsAppFlow } from '@typebot.io/bot-engine/whatsapp/resumeWhatsAppFlow'
import { TRPCError } from '@trpc/server'
import {
  type WhatsAppWebhookRequestBody,
  whatsAppWebhookRequestBodySchema,
} from '@typebot.io/schemas/features/whatsapp'
import { env } from '@typebot.io/env'

const whatsAppPreviewSessionIdPrefix = 'wa-preview-'

export const receiveMessagePreview = publicProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/v1/whatsapp/preview/webhook',
      summary: 'Message webhook',
      tags: ['WhatsApp'],
    },
  })
  .input(whatsAppWebhookRequestBodySchema)
  .output(
    z.object({
      message: z.string(),
    })
  )
  .mutation(async ({ input: { entry } }) => {
    assertEnv()

    const { receivedMessage, contactName, contactPhoneNumber } =
      extractMessageData(entry)
    if (!receivedMessage) return { message: 'No message found' }

    await resumeWhatsAppFlow({
      receivedMessage,
      sessionId: `${whatsAppPreviewSessionIdPrefix}${receivedMessage.from}`,
      contact: {
        name: contactName,
        phoneNumber: contactPhoneNumber,
      },
    })

    return {
      message: 'Message received',
    }
  })

const assertEnv = () => {
  if (!env.WHATSAPP_PREVIEW_FROM_PHONE_NUMBER_ID)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'WHATSAPP_PREVIEW_FROM_PHONE_NUMBER_ID is not defined',
    })
}

const extractMessageData = (entry: WhatsAppWebhookRequestBody['entry']) => {
  const receivedMessage = entry.at(0)?.changes.at(0)?.value.messages?.at(0)
  const contactName =
    entry.at(0)?.changes.at(0)?.value?.contacts?.at(0)?.profile?.name ?? ''
  const contactPhoneNumber =
    entry.at(0)?.changes.at(0)?.value?.messages?.at(0)?.from ?? ''

  return { receivedMessage, contactName, contactPhoneNumber }
}
