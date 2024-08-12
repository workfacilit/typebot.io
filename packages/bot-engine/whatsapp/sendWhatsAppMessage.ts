import {
  WhatsAppCredentials,
  WhatsAppSendingMessage,
} from '@typebot.io/schemas/features/whatsapp'
import { env } from '@typebot.io/env'
import ky from 'ky'
import { logMessage } from '../queries/saveMessageLog'

type Props = {
  to: string
  message: WhatsAppSendingMessage
  credentials: WhatsAppCredentials['data']
  workspaceId?: string
  resultIdWA: string
}

export const sendWhatsAppMessage = async ({
  to,
  message,
  credentials,
  workspaceId,
  resultIdWA,
}: Props) => {
  ky.post(
    `${env.WHATSAPP_CLOUD_API_URL}/v20.0/${credentials.phoneNumberId}/messages`,
    {
      headers: {
        Authorization: `Bearer ${credentials.systemUserAccessToken}`,
      },
      json: {
        messaging_product: 'whatsapp',
        to,
        ...message,
      },
    }
  )
  if (workspaceId) {
    await logMessage(
      workspaceId,
      resultIdWA,
      'outbound',
      JSON.stringify(message),
      to
    )
  }
}
