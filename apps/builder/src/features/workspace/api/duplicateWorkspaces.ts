import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { workspaceSchema } from '@typebot.io/schemas'
import { z } from 'zod'
import { isReadWorkspaceFobidden } from '../helpers/isReadWorkspaceFobidden'

// Função para duplicar Workspace
async function duplicateWorkspaceRecord(oldWorkspace: any) {
  const { ...rest } = oldWorkspace
  return await prisma.workspace.create({ data: rest })
}

// Função para duplicar DashboardFolders
async function duplicateDashboardFolders(
  oldWorkspaceId: string,
  newWorkspaceId: string
) {
  const folders = await prisma.dashboardFolder.findMany({
    where: { workspaceId: oldWorkspaceId },
  })
  for (const folder of folders) {
    const { ...rest } = folder
    await prisma.dashboardFolder.create({
      data: { ...rest, workspaceId: newWorkspaceId },
    })
  }
}

// Função para duplicar CustomDomains
async function duplicateCustomDomains(
  oldWorkspaceId: string,
  newWorkspaceId: string
) {
  const domains = await prisma.customDomain.findMany({
    where: { workspaceId: oldWorkspaceId },
  })
  for (const domain of domains) {
    const { name, ...rest } = domain
    await prisma.customDomain.create({
      data: { name, ...rest, workspaceId: newWorkspaceId },
    })
  }
}

// Função para duplicar ProfilePermissions
async function duplicateProfilePermissions(
  oldWorkspaceId: string,
  newWorkspaceId: string,
  userId: string
) {
  const permission = await prisma.profilePermission.findFirst({
    where: {
      userId,
      workspace: { id: oldWorkspaceId },
    },
  })
  if (permission) {
    const { ...rest } = permission
    return await prisma.profilePermission.create({
      data: { ...rest, userId, workspaceId: newWorkspaceId },
    })
  }
  return {
    id: '',
    workspaceId: newWorkspaceId,
    userId,
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
    canEditFlow: false,
  }
}

// Função para duplicar ProfileInWorkspace
async function duplicateProfileInWorkspace(
  oldWorkspaceId: string,
  newWorkspaceId: string
) {
  const profiles = await prisma.profileInWorkspace.findMany({
    where: { workspaceId: oldWorkspaceId },
  })
  for (const profile of profiles) {
    const { profileId, token } = profile
    await prisma.profileInWorkspace.create({
      data: { profileId, token, workspaceId: newWorkspaceId },
    })
  }
}

// Função para duplicar Typebots
async function duplicateTypebots(
  oldWorkspaceId: string,
  newWorkspaceId: string
) {
  const typebots = await prisma.typebot.findMany({
    where: { workspaceId: oldWorkspaceId },
  })
  for (const typebot of typebots) {
    const { ...rest } = typebot
    // Converte groups para o tipo esperado
    await prisma.typebot.create({
      data: {
        ...rest,
        workspaceId: newWorkspaceId,
        groups: rest.groups as unknown as Prisma.InputJsonValue,
      },
    })
  }
}

export const duplicateWorkspace = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/v1/workspaces/{workspaceId}/duplicate',
      protect: true,
      summary: 'Duplicate workspace',
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
        canEditFlow: z.boolean(),
      }),
    })
  )
  .mutation(async ({ input: { workspaceId }, ctx: { user } }) => {
    // Buscar workspace original
    const oldWorkspace = await prisma.workspace.findFirst({
      where: { id: workspaceId },
      include: { members: true },
    })

    if (!oldWorkspace || isReadWorkspaceFobidden(oldWorkspace, user))
      throw new TRPCError({ code: 'NOT_FOUND', message: 'No workspaces found' })

    // Duplicar Workspace
    const newWorkspace = await duplicateWorkspaceRecord(oldWorkspace)

    // Duplicar relacionamentos, substituindo vinculação para o novo workspace
    await duplicateDashboardFolders(workspaceId, newWorkspace.id)
    await duplicateCustomDomains(workspaceId, newWorkspace.id)
    const newPermissions = await duplicateProfilePermissions(
      workspaceId,
      newWorkspace.id,
      user.id
    )
    await duplicateProfileInWorkspace(workspaceId, newWorkspace.id)
    await duplicateTypebots(workspaceId, newWorkspace.id)

    return {
      workspace: newWorkspace,
      permissions: newPermissions,
    }
  })
