import Bull from 'bull'
import type { Props as ResumeWhatsAppFlowProps } from '@typebot.io/whatsapp/src/resumeWhatsAppFlow'

type JobData =
  | {
      scheduleId?: string
      functionName: 'resumeWhatsAppFlow'
      args: [ResumeWhatsAppFlowProps]
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
      host: 'localhost',
      port: 6379,
    },
  }
)
