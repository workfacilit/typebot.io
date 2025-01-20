import type {
  WhatsAppCredentials,
  WhatsAppSendingMessage,
} from '@typebot.io/schemas/features/whatsapp'
import { env } from '@typebot.io/env'
import ky from 'ky'
import { logMessage } from '@typebot.io/bot-engine/queries/saveMessageLog'
import { sendLogRequest } from '@typebot.io/bot-engine/logWF'

type Props = {
  to: string
  message: WhatsAppSendingMessage
  credentials: WhatsAppCredentials['data']
  workspaceId?: string
  resultIdWA: string
  typebotId: string
}

export const sendWhatsAppMessage = async ({
  to,
  message,
  credentials,
  workspaceId,
  resultIdWA,
  typebotId,
}: Props) => {
  try {
    await ky.post(
      `${env.WHATSAPP_CLOUD_API_URL}/v17.0/${credentials.phoneNumberId}/messages`,
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
  } catch (error) {
    await sendLogRequest(
      'errorSendingWhatsAppMessage@sendWhatsAppMessage',
      error
    )
  }
  if (workspaceId) {
    try {
      await logMessage(
        workspaceId,
        typebotId,
        'outbound',
        resultIdWA,
        JSON.stringify(message),
        to,
        'whatsapp'
      )
    } catch (error) {
      await sendLogRequest('errorLogMessage@sendWhatsAppMessage', error)
    }
  }
}
