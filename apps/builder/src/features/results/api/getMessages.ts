import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { messageSchemaResult } from '@typebot.io/schemas'
import { z } from 'zod'

export const getMessages = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/v1/typebots/results/{resultId}/messages',
      protect: true,
      summary: 'List result messages',
      tags: ['Results'],
    },
  })
  .input(
    z.object({
      resultId: z.string(),
    })
  )
  .output(z.object({ messages: z.array(messageSchemaResult) }))
  .query(async ({ input: { resultId } }) => {
    const messages = await prisma.messageLog.findMany({
      where: {
        resultId: resultId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    })
    if (!messages) throw new Error('messages not found')

    return { messages: messages }
  })
