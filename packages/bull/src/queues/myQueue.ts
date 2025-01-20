import Bull from 'bull'

interface JobData {
  message: string
}

export const myQueue = new Bull<JobData>('my-queue', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
})

myQueue.process(async (job) => {
  console.log('Processando tarefa:', job.data.message)
})
