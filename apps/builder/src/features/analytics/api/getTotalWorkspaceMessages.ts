import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { z } from 'zod'
import {
  StatsWorkspaceCount,
  statsWorkspaceCountSchema,
} from '@typebot.io/schemas'
import { defaultTimeFilter, timeFilterValues } from '../constants'
import {
  parseFromDateFromTimeFilter,
  parseToDateFromTimeFilter,
} from '../helpers/parseDateFromTimeFilter'

export const getTotalWorkspaceMessages = authenticatedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      timeFilter: z.enum(timeFilterValues).default(defaultTimeFilter),
      timeZone: z.string().optional(),
    })
  )
  .output(z.object({ stats: statsWorkspaceCountSchema }))
  .query(async ({ input: { workspaceId, timeFilter, timeZone } }) => {
    const fromDate = parseFromDateFromTimeFilter(timeFilter, timeZone)
    const toDate = parseToDateFromTimeFilter(timeFilter, timeZone)

    const [totalOutbound, totalInbound] = await prisma.$transaction([
      prisma.messageLog.count({
        where: {
          workspaceId,
          direction: 'outbound',
          timestamp: fromDate
            ? {
                gte: fromDate,
                lte: toDate ?? undefined,
              }
            : undefined,
        },
      }),
      prisma.messageLog.count({
        where: {
          workspaceId,
          direction: 'inbound',
          timestamp: fromDate
            ? {
                gte: fromDate,
                lte: toDate ?? undefined,
              }
            : undefined,
        },
      }),
    ])

    const stats: StatsWorkspaceCount = {
      totalOutbound,
      totalInbound,
    }

    return {
      stats,
    }
  })
