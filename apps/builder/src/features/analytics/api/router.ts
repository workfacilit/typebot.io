import { router } from '@/helpers/server/trpc'
import { getStats } from './getStats'
import { getTotalWorkspaceMessages } from './getTotalWorkspaceMessages'
import { getInDepthAnalyticsData } from './getInDepthAnalyticsData'

export const analyticsRouter = router({
  getInDepthAnalyticsData,
  getStats,
  getTotalWorkspaceMessages,
})
