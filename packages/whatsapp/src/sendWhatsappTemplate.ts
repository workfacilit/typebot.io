import type { WhatsAppCredentials } from '@typebot.io/schemas/features/whatsapp'
import { type WhatsAppTemplate } from '@typebot.io/schemas/features/whatsapp-templates'
import { env } from '@typebot.io/env'
import ky from 'ky'
import { logMessage } from '@typebot.io/bot-engine/queries/saveMessageLog'
import { sendLogRequest } from '@typebot.io/bot-engine/logWF'

type Props = {
  to: string
  template: WhatsAppTemplate
  credentials: WhatsAppCredentials['data']
  workspaceId?: string
  resultIdWA: string
  typebotId: string
}

export const sendWhatsAppTemplate = async ({
  to,
  template,
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
          recipient_type: 'individual',
          to,
          type: 'template',
          template: template.template,
        },
      }
    )
  } catch (error) {
    await sendLogRequest(
      'errorSendingWhatsAppTemplate@sendWhatsAppTemplate',
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
        JSON.stringify(template),
        to,
        'whatsapp'
      )
    } catch (error) {
      await sendLogRequest('errorLogMessage@sendWhatsAppTemplate', error)
    }
  }
}
