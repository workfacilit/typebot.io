import { blockBaseSchema } from '../../shared'
import { z } from 'zod'
import { LogicBlockType } from '../constants'

export const waitOptionsWebhookSchema = z.object({
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

export const webhookRequestBlockSchema = blockBaseSchema
  .merge(
    z.object({
      type: z.enum([LogicBlockType.WEBHOOK_REQUEST]),
      options: waitOptionsWebhookSchema.optional(),
    })
  )
  .openapi({
    title: 'Webhook',
    ref: 'webhookLogic',
  })

export type WebhookBlock = z.infer<typeof webhookRequestBlockSchema>
