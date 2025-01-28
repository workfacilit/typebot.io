import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { myQueueResumeWhatsAppFlow } from '@typebot.io/whatsapp/src/queue/services/myQueueResumeWhatsAppFlow'

const serverAdapter = new ExpressAdapter()

// Configura o Bull Board
createBullBoard({
  queues: [new BullAdapter(myQueueResumeWhatsAppFlow)],
  serverAdapter,
})

// Define o caminho para acessar o dashboard
serverAdapter.setBasePath('/api/bull-board')

export default serverAdapter.getRouter()
