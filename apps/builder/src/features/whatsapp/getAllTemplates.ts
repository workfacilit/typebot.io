import { authenticatedProcedure } from '@/helpers/server/trpc'
import { z } from 'zod'
import ky from 'ky'
import prisma from '@typebot.io/lib/prisma'
import { decrypt } from '@typebot.io/lib/api/encryption/decrypt'
import { TRPCError } from '@trpc/server'
import { WhatsAppCredentials } from '@typebot.io/schemas/features/whatsapp'
import { env } from '@typebot.io/env'

const inputSchema = z.object({
  credentialsId: z.string().optional(),
  systemToken: z.string().optional(),
  phoneNumberId: z.string().optional(),
})

export const getAllTemplates = authenticatedProcedure
  .input(inputSchema)
  .query(async ({ input, ctx: { user } }) => {
    const credentials = await getCredentials(user.id, input)
    if (!credentials) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Credentials not found',
      })
    }

    const url = `${env.WHATSAPP_CLOUD_API_URL}/v18.0/${credentials.bussinessWBId}/message_templates`
    const headers = {
      Authorization: `Bearer ${credentials.systemUserAccessToken}`,
    }

    try {
      const response = await ky.get(url, { headers }).json<{
        data: Array<{
          name: string
          components: Array<{
            type: string
            text?: string
            format?: string
            buttons?: Array<{ type: string; text: string }>
          }>
          language: string
          status: string
          category: string
          id: string
        }>
      }>()

      return response.data
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch templates',
      })
    }
  })

const getCredentials = async (
  userId: string,
  input: z.infer<typeof inputSchema>
): Promise<WhatsAppCredentials['data'] | undefined> => {
  if (input.systemToken && input.phoneNumberId)
    return {
      systemUserAccessToken: input.systemToken,
      phoneNumberId: input.phoneNumberId,
    }
  if (!input.credentialsId) return
  const credentials = await prisma.credentials.findUnique({
    where: {
      id: input.credentialsId,
      workspace: { members: { some: { userId } } },
    },
  })
  if (!credentials) return
  const decryptedData = (await decrypt(
    credentials.data,
    credentials.iv
  )) as WhatsAppCredentials['data']
  return {
    phoneNumberId: decryptedData.phoneNumberId,
    systemUserAccessToken: decryptedData.systemUserAccessToken,
    bussinessWBId: credentials.identifier ?? undefined,
  }
}
