import { z } from '../../../../zod'
import { blockBaseSchema } from '../../shared'
import { LogicBlockType } from '../constants'

export const schedulingOptionsSchema = z.object({
  secondsToWaitFor: z.string().optional(),
  sessionConcluded: z.boolean().optional(),
})

export const schedulingBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.enum([LogicBlockType.SCHEDULING]),
    options: schedulingOptionsSchema.optional(),
  })
)

export type SchedulingBlock = z.infer<typeof schedulingBlockSchema>
