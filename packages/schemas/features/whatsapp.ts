import { z } from '../zod'
import { credentialsBaseSchema } from './blocks/shared'
import {
  ComparisonOperators,
  LogicalOperator,
} from './blocks/logic/condition/constants'

const mediaSchema = z.object({ link: z.string() })

const headerSchema = z
  .object({
    type: z.literal('image'),
    image: mediaSchema,
  })
  .or(
    z.object({
      type: z.literal('video'),
      video: mediaSchema,
    })
  )
  .or(
    z.object({
      type: z.literal('text'),
      text: z.string(),
    })
  )

const bodySchema = z.object({
  text: z.string(),
})

const actionSchema = z.object({
  buttons: z.array(
    z.object({
      type: z.literal('reply'),
      reply: z.object({ id: z.string(), title: z.string() }),
    })
  ),
})

const templateSchema = z.object({
  name: z.string(),
  language: z.object({
    code: z.string(),
  }),
})

const listSchema = z.object({
  button: z.string().nullable().optional(), // Faz button ser opcional, pois não é usado na lista
  sections: z.array(
    z.object({
      title: z.string(),
      rows: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
        })
      ),
    })
  ),
})

const interactiveSchema = z
  .object({
    type: z.literal('button'),
    header: headerSchema.optional(),
    body: bodySchema.optional(),
    action: actionSchema,
  })
  .or(
    z.object({
      type: z.literal('list'),
      header: headerSchema.optional(),
      body: bodySchema.optional(),
      action: listSchema,
    })
  )

// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#message-object
const sendingMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    text: z.object({
      body: z.string(),
      preview_url: z.boolean().optional(),
    }),
    preview_url: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('image'),
    image: mediaSchema,
  }),
  z.object({
    type: z.literal('audio'),
    audio: mediaSchema,
  }),
  z.object({
    type: z.literal('video'),
    video: mediaSchema,
  }),
  z.object({
    type: z.literal('interactive'),
    interactive: interactiveSchema,
  }),
  z.object({
    type: z.literal('template'),
    template: templateSchema,
  }),
])

export const incomingMessageSchema = z.discriminatedUnion('type', [
  z.object({
    from: z.string(),
    type: z.literal('text'),
    text: z.object({
      body: z.string(),
    }),
    timestamp: z.string(),
  }),
  z.object({
    from: z.string(),
    type: z.literal('button'),
    button: z.object({
      text: z.string(),
      payload: z.string(),
    }),
    timestamp: z.string(),
  }),
  z.object({
    from: z.string(),
    type: z.literal('interactive'),
    interactive: z.object({
      type: z.enum(['button_reply', 'list_reply']),
      button_reply: z
        .object({
          id: z.string(),
          title: z.string(),
        })
        .optional(),
      list_reply: z
        .object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
        })
        .optional(),
    }),
    timestamp: z.string(),
  }),
  z.object({
    from: z.string(),
    type: z.literal('image'),
    image: z.object({ id: z.string(), caption: z.string().optional() }),
    timestamp: z.string(),
  }),
  z.object({
    from: z.string(),
    type: z.literal('video'),
    video: z.object({ id: z.string(), caption: z.string().optional() }),
    timestamp: z.string(),
  }),
  z.object({
    from: z.string(),
    type: z.literal('audio'),
    audio: z.object({ id: z.string() }),
    timestamp: z.string(),
  }),
  z.object({
    from: z.string(),
    type: z.literal('document'),
    document: z.object({ id: z.string(), caption: z.string().optional() }),
    timestamp: z.string(),
  }),
  z.object({
    from: z.string(),
    type: z.literal('location'),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    timestamp: z.string(),
  }),
  z.object({
    from: z.string(),
    type: z.literal('webhook'),
    webhook: z.object({
      data: z.string(),
    }),
    timestamp: z.string(),
  }),
])

export const whatsAppWebhookRequestBodySchema = z.object({
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          value: z.object({
            metadata: z.object({
              phone_number_id: z.string(),
            }),
            contacts: z
              .array(
                z.object({
                  profile: z.object({
                    name: z.string(),
                  }),
                })
              )
              .optional(),
            messages: z.array(incomingMessageSchema).optional(),
          }),
        })
      ),
    })
  ),
})

export type WhatsAppWebhookRequestBody = z.infer<
  typeof whatsAppWebhookRequestBodySchema
>

export const whatsAppCredentialsSchema = z
  .object({
    type: z.literal('whatsApp'),
    data: z.object({
      systemUserAccessToken: z.string(),
      phoneNumberId: z.string(),
      bussinessWBId: z.string().optional(),
    }),
  })
  .merge(credentialsBaseSchema)

const whatsAppComparisonSchema = z.object({
  id: z.string(),
  comparisonOperator: z.nativeEnum(ComparisonOperators).optional(),
  value: z.string().optional(),
})
export type WhatsAppComparison = z.infer<typeof whatsAppComparisonSchema>

const startConditionSchema = z.object({
  logicalOperator: z.nativeEnum(LogicalOperator),
  comparisons: z.array(
    z.object({
      id: z.string(),
      comparisonOperator: z.nativeEnum(ComparisonOperators).optional(),
      value: z.string().optional(),
    })
  ),
})

export const whatsAppSettingsSchema = z.object({
  isEnabled: z.boolean().optional(),
  startCondition: startConditionSchema.optional(),
  sessionExpiryTimeout: z
    .number()
    .max(48)
    .min(0.01)
    .optional()
    .describe('Expiration delay in hours after latest interaction'),
})

export const PropsSchemaResumeWppFlow = z.object({
  receivedMessage: z.object({
    from: z.string(),
    type: z.string(),
    text: z.object({ body: z.string() }).optional(),
    timestamp: z.string(),
  }),
  sessionId: z.string(),
  credentialsId: z.string().optional(),
  phoneNumberId: z.string().optional(),
  workspaceId: z.string().optional(),
  contact: z
    .object({
      name: z.string().optional(),
      phoneNumber: z.string(),
    })
    .optional(),
  origin: z.literal('webhook').optional(),
  transitionBlock: z.boolean().optional(),
  transitionData: z.object({}).optional(),
})

export const defaultSessionExpiryTimeout = 4

export type WhatsAppIncomingMessage = z.infer<typeof incomingMessageSchema>
export type WhatsAppSendingMessage = z.infer<typeof sendingMessageSchema>
export type WhatsAppCredentials = z.infer<typeof whatsAppCredentialsSchema>
