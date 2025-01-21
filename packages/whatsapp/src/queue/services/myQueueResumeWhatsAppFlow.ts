import Bull from 'bull'
import type { SessionState } from '@typebot.io/schemas/features/chat/sessionState'
import type { WhatsAppIncomingMessage } from '@typebot.io/schemas/features/whatsapp'
import { sendLogRequest } from '@typebot.io/bot-engine/logWF'
import { resumeWhatsAppFlow } from '../../resumeWhatsAppFlow'
import { DateTime } from 'luxon' // Adicionada a importação de DateTime

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

// Função para agendar o job na fila
export async function scheduleMyQueueResumeWhatsAppFlow(
  scheduleId: string,
  args: Props,
  minutes: number
) {
  const existingJob = await myQueueResumeWhatsAppFlow.getJob(scheduleId)
  if (existingJob) {
    await existingJob.remove()
  }

  const nowInSaoPaulo = DateTime.now().setZone('America/Sao_Paulo')
  const futureTime = nowInSaoPaulo.plus({ minutes })
  const nowInSaoPauloCurrent = DateTime.now().setZone('America/Sao_Paulo')
  const delayEmMilissegundos =
    futureTime.toMillis() - nowInSaoPauloCurrent.toMillis()

  await sendLogRequest(
    'errorProcess@myQueueResumeWhatsAppFlow',
    delayEmMilissegundos
  )

  try {
    // Defina o jobData com a tipagem correta
    const jobData: JobData = {
      functionName: 'resumeWhatsAppFlow',
      args: [args], // Passando args como um array de Props
    }

    // Adiciona o job com o jobData na fila
    await myQueueResumeWhatsAppFlow.add(jobData, {
      jobId: scheduleId,
      delay: delayEmMilissegundos,
    })
  } catch (error) {
    await sendLogRequest('error@myQueueResumeWhatsAppFlow', error)
  }

  console.log('Tarefa agendada com sucesso!')
}

myQueueResumeWhatsAppFlow.process(async (job) => {
  try {
    const { args } = job.data

    // Validação para garantir que args seja do tipo esperado
    if (!isResumeWhatsAppFlowProps(args)) {
      await sendLogRequest('errorFormato@myQueueResumeWhatsAppFlow', args)
      throw new Error('Formato de dados inválido para ResumeWhatsAppFlowProps')
    }

    // Agora args é validado como ResumeWhatsAppFlowProps
    await resumeWhatsAppFlow(args)
  } catch (error) {
    await sendLogRequest('errorProcess@myQueueResumeWhatsAppFlow', error)
  }
})

// Função de type guard para validar o tipo de args
function isResumeWhatsAppFlowProps(obj: any): obj is Props {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'receivedMessage' in obj &&
    'sessionId' in obj
  )
}
