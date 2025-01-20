import { myQueueResumeWhatsAppFlow } from '@typebot.io/bull/src/queues/myQueueResumeWhatsAppFlow'
import type { Props as ResumeWhatsAppFlowProps } from '../resumeWhatsAppFlow'
import { resumeWhatsAppFlow } from '../resumeWhatsAppFlow'
import { sendLogRequest } from '@typebot.io/bot-engine/logWF'
import { DateTime } from 'luxon'

myQueueResumeWhatsAppFlow.process(async (job) => {
  try {
    const { args } = job.data
    await resumeWhatsAppFlow(args as ResumeWhatsAppFlowProps)
  } catch (error) {
    await sendLogRequest('errorLogMessage@myQueueResumeWhatsAppFlow', error)
  }
  console.log('Processando a tarefa:', job.data.message)
})

export async function scheduleMyQueueResumeWhatsAppFlow(
  scheduleId: string,
  args: ResumeWhatsAppFlowProps,
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
    await myQueueResumeWhatsAppFlow.add(
      {
        scheduleId,
        functionName: 'resumeWhatsAppFlow',
        args: [args],
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
