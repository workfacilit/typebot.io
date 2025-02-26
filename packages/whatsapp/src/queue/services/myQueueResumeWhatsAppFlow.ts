import Bull from 'bull'
import type { SessionState } from '@typebot.io/schemas/features/chat/sessionState'
import type { WhatsAppIncomingMessage } from '@typebot.io/schemas/features/whatsapp'
import { sendLogRequest } from '@typebot.io/bot-engine/logWF'
import { resumeWhatsAppFlow } from '../../resumeWhatsAppFlow'
import { DateTime } from 'luxon' // Adicionada a importação de DateTime
import { env } from '@typebot.io/env'

export type Props = {
  receivedMessage: WhatsAppIncomingMessage
  sessionId: string
  credentialsId?: string
  phoneNumberId?: string
  workspaceId?: string
  contact?: NonNullable<SessionState['whatsApp']>['contact']
  origin?: 'webhook'
  transitionBlock?: boolean
  transitionData?: object
  blockTransition?: boolean
}

type JobData =
  | {
      scheduleId?: string
      functionName: 'resumeWhatsAppFlow'
      args: Props
    }
  | {
      scheduleId?: string
      functionName: 'sendMessage'
      args: object
    }

export const myQueueResumeWhatsAppFlow = new Bull<JobData>(
  'resumeWhatsAppFlow',
  {
    redis: {
      host: env.REDIS_QUEUE_SERVER,
      port: 6379,
    },
  }
)

// Função para agendar o job na fila
export async function scheduleMyQueueResumeWhatsAppFlow(
  scheduleId: string,
  args: Props,
  minutes: number
) {
  await removeScheduleMyQueueResumeWhatsAppFlow(scheduleId)

  const nowInSaoPaulo = DateTime.now().setZone('America/Sao_Paulo')
  const futureTime = nowInSaoPaulo.plus({ minutes })
  const nowInSaoPauloCurrent = DateTime.now().setZone('America/Sao_Paulo')
  const delayEmMilissegundos =
    futureTime.toMillis() - nowInSaoPauloCurrent.toMillis()

  try {
    // Adiciona o job à fila, passando os args como um objeto no formato correto
    await myQueueResumeWhatsAppFlow.add(
      {
        functionName: 'resumeWhatsAppFlow',
        args: { ...args }, // Passando args como um array de Props
      },
      {
        jobId: scheduleId,
        delay: delayEmMilissegundos,
      }
    )
    console.log('Tarefa agendada com sucesso!' + scheduleId)
  } catch (error) {
    console.log('Erro ao agendar tarefa!')
    await sendLogRequest('error@scheduleMyQueueResumeWhatsAppFlow', error)
  }
}

export async function removeScheduleMyQueueResumeWhatsAppFlow(
  scheduleId: string
) {
  const existingJob = await myQueueResumeWhatsAppFlow.getJob(scheduleId)
  if (existingJob) {
    await existingJob.remove()
    console.log('Tarefa removida com sucesso!' + scheduleId)
  }
}

myQueueResumeWhatsAppFlow.process(async (job) => {
  try {
    const { args } = job.data
    // await sendLogRequest('args@myQueueResumeWhatsAppFlow', args)
    await resumeWhatsAppFlow(args as Props)
  } catch (error) {
    await sendLogRequest('errorProcess@myQueueResumeWhatsAppFlow', error)
  }
})
