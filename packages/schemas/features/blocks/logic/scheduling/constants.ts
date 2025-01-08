import type { SchedulingBlock } from './schema'

export const defaultWaitOptions = {
  sessionConcluded: false,
} as const satisfies SchedulingBlock['options']
