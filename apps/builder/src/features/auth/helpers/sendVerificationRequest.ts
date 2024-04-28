import { env } from '@typebot.io/env'

type Props = {
  identifier: string
  url: string
}

export const sendVerificationRequest = async ({ identifier, url }: Props) => {
  try {
    const data = {
      identifier,
      url,
    }
    if (env.WF_REQUEST_SERVER) {
      await fetch(
        `https://${env.WF_REQUEST_SERVER}.workfacilit.com/app/prod/api/demandas/chatbot/authentication`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Atend-Token': 'WF',
            Authorization:
              'Basic ODM1VFJHREhTNjNVSEY4NDdISERKM1U3OjI3NjRIRkpTS1M4NTZSSk1KRDg3M1lFTUQ3',
          },
          body: JSON.stringify(data),
        }
      )
    }
  } catch (err) {
    console.error(err)
    throw new Error(`Magic link email could not be sent. See error above.`)
  }
}
