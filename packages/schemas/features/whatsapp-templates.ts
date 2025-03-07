import { z } from '../zod'

// Parâmetros dos componentes
const textParameterSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
})

const currencyParameterSchema = z.object({
  type: z.literal('currency'),
  currency: z.object({
    fallback_value: z.string(),
    code: z.string(),
    amount_1000: z.number(),
  }),
})

const dateTimeParameterSchema = z.object({
  type: z.literal('date_time'),
  date_time: z.object({
    fallback_value: z.string(),
    day_of_week: z.number().optional(),
    year: z.number().optional(),
    month: z.number().optional(),
    day_of_month: z.number().optional(),
    hour: z.number().optional(),
    minute: z.number().optional(),
    calendar: z.string().optional(),
  }),
})

const imageParameterSchema = z.object({
  type: z.literal('image'),
  image: z.object({
    link: z.string(),
  }),
})

const payloadParameterSchema = z.object({
  type: z.literal('payload'),
  payload: z.string(),
})

// Componentes do template
const bodyComponentSchema = z.object({
  type: z.literal('body'),
  parameters: z.array(
    z.union([
      textParameterSchema,
      currencyParameterSchema,
      dateTimeParameterSchema,
    ])
  ),
})

const headerComponentSchema = z.object({
  type: z.literal('header'),
  parameters: z.array(imageParameterSchema),
})

const buttonComponentSchema = z.object({
  type: z.literal('button'),
  sub_type: z.literal('quick_reply'),
  index: z.string(),
  parameters: z.array(payloadParameterSchema),
})

export const whatsAppTemplateSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  recipient_type: z.literal('individual'),
  to: z.string(),
  type: z.literal('template'),
  template: z.object({
    name: z.string(),
    language: z.object({
      code: z.string(),
    }),
    components: z.array(
      z.union([
        bodyComponentSchema,
        headerComponentSchema,
        buttonComponentSchema,
      ])
    ),
  }),
})

export type WhatsAppTemplate = z.infer<typeof whatsAppTemplateSchema>
