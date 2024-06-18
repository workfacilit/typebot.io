import {
  WhatsAppCredentials,
  WhatsAppSendingMessage,
} from '@typebot.io/schemas/features/whatsapp'
import { env } from '@typebot.io/env'
import ky from 'ky'

type Props = {
  to: string
  message: WhatsAppSendingMessage
  credentials: WhatsAppCredentials['data']
}

export const sendWhatsAppMessage = async ({
  to,
  message,
  credentials,
}: Props) => {
  if (env.WF_REQUEST_SERVER) {
    var dataRequest4 = {
      tipo: 'sendWhatsAppMessage@sendWhatsAppMessage',
      message,
    }
    await fetch(
      `https://wfv2-dev07.workfacilit.com/app/prod/api/demandas/inserir-log`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Atend-Token': 'WF',
          Authorization:
            'Basic ODM1VFJHREhTNjNVSEY4NDdISERKM1U3OjI3NjRIRkpTS1M4NTZSSk1KRDg3M1lFTUQ3',
        },
        body: JSON.stringify(dataRequest4),
      }
    )
  }

  ky.post(
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
}
