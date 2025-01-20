import { myQueueResumeWhatsAppFlow } from '../queues/myQueueResumeWhatsAppFlow'
;(async () => {
  console.log('Worker para myQueue iniciado.')
  await myQueueResumeWhatsAppFlow.isReady()
})()
