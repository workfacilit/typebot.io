import prisma from '@typebot.io/lib/prisma'

export const logMessage = async (
  workspaceId: string,
  typebotId: string,
  direction: 'inbound' | 'outbound',
  resultId?: string,
  message?: any,
  identifier?: string,
  channel?: string
) =>
  await prisma.messageLog.create({
    data: {
      workspaceId,
      typebotId,
      direction,
      ...(resultId && { resultId }),
      message,
      identifier,
      channel,
    },
  })
