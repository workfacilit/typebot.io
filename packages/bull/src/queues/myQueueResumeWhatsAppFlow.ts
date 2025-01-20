import Bull from 'bull'
import type { SessionState } from '@typebot.io/schemas/features/chat/sessionState'
import type { WhatsAppIncomingMessage } from '@typebot.io/schemas/features/whatsapp'

type Props = {
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

type JobData =
  | {
      scheduleId?: string
      functionName: 'resumeWhatsAppFlow'
      args: [Props]
    }
  | {
      scheduleId?: string
      functionName: 'sendMessage'
      args: string[]
    }

export const myQueueResumeWhatsAppFlow = new Bull<JobData>(
  'resumeWhatsAppFlow',
  {
    redis: {
      host: 'redis',
      port: 6379,
    },
  }
)
