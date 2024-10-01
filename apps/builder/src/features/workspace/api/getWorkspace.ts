import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { workspaceSchema } from '@typebot.io/schemas'
import { z } from 'zod'
import { isReadWorkspaceFobidden } from '../helpers/isReadWorkspaceFobidden'

export const getWorkspace = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/v1/workspaces/{workspaceId}',
      protect: true,
      summary: 'Get workspace',
      tags: ['Workspace'],
    },
  })
  .input(
    z.object({
      workspaceId: z
        .string()
        .describe(
          '[Where to find my workspace ID?](../how-to#how-to-find-my-workspaceid)'
        ),
    })
  )
  .output(
    z.object({
      workspace: workspaceSchema.omit({
        chatsLimitFirstEmailSentAt: true,
        chatsLimitSecondEmailSentAt: true,
        storageLimitFirstEmailSentAt: true,
        storageLimitSecondEmailSentAt: true,
        customStorageLimit: true,
        additionalChatsIndex: true,
        additionalStorageIndex: true,
        isQuarantined: true,
      }),
      permissions: z.object({
        id: z.string(),
        workspaceId: z.string(),
        userId: z.string(),
        canCreateFlowOrFolder: z.boolean(),
        canViewSettings: z.boolean(),
        canCreateNewWorkspace: z.boolean(),
        canConfigureTheme: z.boolean(),
        canConfigureFlowSettings: z.boolean(),
        canShareFlow: z.boolean(),
        canPublish: z.boolean(),
        canViewResults: z.boolean(),
        canDuplicateAndExport: z.boolean(),
        canDeleteFlow: z.boolean(),
      }),
    })
  )
  .query(async ({ input: { workspaceId }, ctx: { user } }) => {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId },
      include: {
        members: true,
      },
    })

    const permissions = (await prisma.profilePermission.findFirst({
      where: {
        userId: user.id,
        workspace: {
          id: workspaceId,
        },
      },
    })) || {
      id: '',
      workspaceId: '',
      userId: '',
      canCreateFlowOrFolder: false,
      canViewSettings: false,
      canCreateNewWorkspace: false,
      canConfigureTheme: false,
      canConfigureFlowSettings: false,
      canShareFlow: false,
      canPublish: false,
      canViewResults: false,
      canDuplicateAndExport: false,
      canDeleteFlow: false,
    }

    if (!workspace || isReadWorkspaceFobidden(workspace, user))
      throw new TRPCError({ code: 'NOT_FOUND', message: 'No workspaces found' })

    return {
      workspace,
      permissions,
    }
  })
