import prisma from '@typebot.io/lib/prisma'
import { Stats } from '@typebot.io/schemas'
import { NextApiRequest, NextApiResponse } from 'next'
import { canReadTypebots } from '@/helpers/databaseRules'
import { getAuthenticatedUser } from '@/features/auth/helpers/getAuthenticatedUser'
import { methodNotAllowed, notAuthenticated } from '@typebot.io/lib/api'

// TODO: Delete, as it has been migrated to tRPC
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getAuthenticatedUser(req, res)
  if (!user) return notAuthenticated(res)
  if (req.method === 'GET') {
    const typebotId = req.query.typebotId as string

    const typebot = await prisma.typebot.findFirst({
      where: canReadTypebots(typebotId, user),
      select: { id: true },
    })

    if (!typebot) return res.status(404).send({ message: 'Typebot not found' })

    const [
      totalViews,
      totalStarts,
      totalCompleted,
      totalOutbound,
      totalInbound,
    ] = await prisma.$transaction([
      prisma.result.count({
        where: {
          typebotId: typebot.id,
          isArchived: false,
        },
      }),
      prisma.result.count({
        where: {
          typebotId: typebot.id,
          isArchived: false,
          hasStarted: true,
        },
      }),
      prisma.result.count({
        where: {
          typebotId: typebot.id,
          isArchived: false,
          isCompleted: true,
        },
      }),
      prisma.messageLog.count({
        where: {
          typebotId: typebot.id,
          direction: 'outbound',
        },
      }),
      prisma.messageLog.count({
        where: {
          typebotId: typebot.id,
          direction: 'inbound',
        },
      }),
    ])

    const stats: Stats = {
      totalViews,
      totalStarts,
      totalCompleted,
      totalOutbound,
      totalInbound,
    }
    return res.status(200).send({ stats })
  }
  return methodNotAllowed(res)
}

export default handler
