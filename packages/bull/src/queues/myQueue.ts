import Bull from 'bull'

interface JobData {
  message: string
}

export const myQueue = new Bull<JobData>('my-queue', {
  redis: {
    host: 'redis',
    port: 6379,
  },
})

myQueue.process(async (job) => {
  console.log('Processando a tarefa:', job.data.message)
})
