import { myQueueResumeWhatsAppFlow } from '@typebot.io/bull/src/queues/myQueueResumeWhatsAppFlow'
import type { Props as ResumeWhatsAppFlowProps } from '../resumeWhatsAppFlow'

export async function scheduleMyQueueResumeWhatsAppFlow(
  scheduleId: string,
  args: ResumeWhatsAppFlowProps,
  minutes: number
) {
  const existingJob = await myQueueResumeWhatsAppFlow.getJob(scheduleId)
  if (existingJob) {
    await existingJob.remove()
  }

  const nowInSaoPaulo = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  )
  nowInSaoPaulo.setMinutes(nowInSaoPaulo.getMinutes() + minutes)

  const delayEmMilissegundos = nowInSaoPaulo.getTime() - Date.now()

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

  console.log('Tarefa agendada com sucesso!')
}
