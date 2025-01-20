import Bull from 'bull'

interface JobData {
  message: string
}

export const myQueue = new Bull<JobData>('my-queue', {
  redis: {
    host: '127.0.0.1',
    port: 6379,
  },
})

myQueue.process(async (job) => {
  console.log('Processando a tarefa:', job.data.message)
})
