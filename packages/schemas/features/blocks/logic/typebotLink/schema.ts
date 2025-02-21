import { z } from '../../../../zod'
import { blockBaseSchema } from '../../shared'
import { LogicBlockType } from '../constants'

export const typebotLinkOptionsSchema = z.object({
  typebotId: z.string().optional(),
  groupId: z.string().optional(),
  mergeResults: z.boolean().optional(),
  schedule: z
    .object({
      minutes: z.number().int().optional(),
      session: z.boolean().optional(),
      actived: z.boolean().optional(),
    })
    .optional(),
})

export const typebotLinkBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.enum([LogicBlockType.TYPEBOT_LINK]),
    options: typebotLinkOptionsSchema.optional(),
  })
)

export type TypebotLinkBlock = z.infer<typeof typebotLinkBlockSchema>
