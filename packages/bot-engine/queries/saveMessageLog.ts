import prisma from '@typebot.io/lib/prisma'

export const logMessage = async (
  workspaceId: string,
  resultId: string,
  direction: 'inbound' | 'outbound',
  message?: any,
  identifier?: string
) =>
  await prisma.messageLog.create({
    data: {
      workspaceId,
      resultId,
      direction,
      message,
      identifier,
    },
  })
