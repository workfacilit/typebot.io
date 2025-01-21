import {
  myQueueResumeWhatsAppFlow,
  type Props,
} from '../services/myQueueResumeWhatsAppFlow'
import { sendLogRequest } from '@typebot.io/bot-engine/logWF'
import { DateTime } from 'luxon'

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

  try {
    // Adiciona o job à fila, passando os args como um objeto no formato correto
    await myQueueResumeWhatsAppFlow.add(
      {
        functionName: 'resumeWhatsAppFlow',
        args: [args], // Passando args como um array de Props
      },
      {
        jobId: scheduleId,
        delay: delayEmMilissegundos,
      }
    )
  } catch (error) {
    await sendLogRequest('error@myQueueResumeWhatsAppFlow', error)
  }

  console.log('Tarefa agendada com sucesso!')
}
