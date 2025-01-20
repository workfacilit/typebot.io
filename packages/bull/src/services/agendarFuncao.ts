import { myQueue } from '../queues/myQueue'

export async function agendarFuncao() {
  const delayEmMilissegundos = 5 * 60 * 1000

  await myQueue.add(
    { message: 'Esta é uma tarefa agendada' },
    { delay: delayEmMilissegundos }
  )

  console.log('Tarefa agendada com sucesso!')
}
