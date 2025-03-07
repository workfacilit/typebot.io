import { publicProcedure } from '@/helpers/server/trpc'
import {
  whatsAppWebhookRequestBodySchema,
  type WhatsAppWebhookRequestBody,
} from '@typebot.io/schemas/features/whatsapp'
import { whatsAppTemplateSchema } from '@typebot.io/schemas/features/whatsapp-templates'
import { z } from 'zod'
import { resumeWhatsAppFlow } from '@typebot.io/whatsapp/src/resumeWhatsAppFlow'
import { sendWhatsAppTemplate } from '@typebot.io/whatsapp/src/sendWhatsAppTemplate'

const whatsAppSessionIdPrefix = 'wa-'

export const receiveMessage = publicProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/v1/workspaces/{workspaceId}/whatsapp/{credentialsId}/webhook',
      summary: 'Message webhook',
      tags: ['WhatsApp'],
    },
  })
  .input(
    z
      .object({ workspaceId: z.string(), credentialsId: z.string() })
      .merge(whatsAppWebhookRequestBodySchema)
  )
  .output(
    z.object({
      message: z.string(),
    })
  )
  .mutation(async ({ input: { entry, credentialsId, workspaceId } }) => {
    const { receivedMessage, contactName, contactPhoneNumber, phoneNumberId } =
      extractMessageDetails(entry)
    if (!receivedMessage) return { message: 'No message found' }
    if (!phoneNumberId) return { message: 'No phone number found' }

    await resumeWhatsAppFlow({
      receivedMessage,
      sessionId: `${whatsAppSessionIdPrefix}${phoneNumberId}-${receivedMessage.from}`,
      phoneNumberId,
      credentialsId,
      workspaceId,
      contact: {
        name: contactName,
        phoneNumber: contactPhoneNumber,
      },
    })

    return {
      message: 'Message received',
    }
  })

export const sendTemplate = publicProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/v1/workspaces/{workspaceId}/whatsapp/{credentialsId}/send-template',
      summary: 'Send WhatsApp template',
      tags: ['WhatsApp'],
    },
  })
  .input(whatsAppTemplateSchema)
  .output(
    z.object({
      message: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    await sendWhatsAppTemplate(input)
    return {
      message: 'Template sent',
    }
  })

const extractMessageDetails = (entry: WhatsAppWebhookRequestBody['entry']) => {
  const receivedMessage = entry.at(0)?.changes.at(0)?.value.messages?.at(0)
  const contactName =
    entry.at(0)?.changes.at(0)?.value?.contacts?.at(0)?.profile?.name ?? ''
  const contactPhoneNumber =
    entry.at(0)?.changes.at(0)?.value?.messages?.at(0)?.from ?? ''
  const phoneNumberId = entry.at(0)?.changes.at(0)?.value
    .metadata.phone_number_id
  return { receivedMessage, contactName, contactPhoneNumber, phoneNumberId }
}
