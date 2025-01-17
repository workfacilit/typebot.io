import { blockBaseSchema } from '@typebot.io/schemas/features/blocks/shared'
import { z } from '@typebot.io/schemas/zod'
import { LogicBlockType } from '@typebot.io/schemas/features/blocks/logic/constants'

export const waitOptionsSchema = z.object({
  responseVariableMapping: z
    .array(
      z.object({
        id: z.string(),
        variableId: z.string().optional(),
        bodyPath: z.string().optional(),
      })
    )
    .optional(),
})

export const webhookBlockSchema = blockBaseSchema
  .merge(
    z.object({
      type: z.enum([LogicBlockType.WEBHOOK_REQUEST]),
      options: waitOptionsSchema.optional(),
    })
  )
  .openapi({
    title: 'Webhook',
    ref: 'webhookLogic',
  })

export type WebhookBlock = z.infer<typeof webhookBlockSchema>
