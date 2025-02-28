import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { isReadWorkspaceFobidden } from '../helpers/isReadWorkspaceFobidden'
import type { Block, Group } from '@typebot.io/schemas'
import { LogicBlockType } from '@typebot.io/schemas/features/blocks/logic/constants'
import { Prisma } from '@prisma/client'

// Variável para manter mapeamento de ids de typebots (antigo -> novo)
let typebotMapping: Record<string, string> = {}

// Função para duplicar Workspace com gravação do id de origem
async function duplicateWorkspaceRecord(oldWorkspace: any) {
  const { id, members, ...workspaceDataWithoutRelations } = oldWorkspace

  // Criar o workspace sem os membros
  const newWorkspace = await prisma.workspace.create({
    data: {
      ...workspaceDataWithoutRelations,
      name: `${workspaceDataWithoutRelations.name} Copy`,
      originId: id,
    },
  })

  // Adicionar os membros separadamente
  if (members && members.length > 0) {
    for (const member of members) {
      await prisma.memberInWorkspace.create({
        data: {
          userId: member.userId,
          workspaceId: newWorkspace.id,
          role: member.role,
        },
      })
    }
  }

  return newWorkspace
}

// Função para duplicar DashboardFolders e retornar mapeamento de ids antigos para os novos
async function duplicateDashboardFolders(
  oldWorkspaceId: string,
  newWorkspaceId: string
) {
  const folders = await prisma.dashboardFolder.findMany({
    where: { workspaceId: oldWorkspaceId },
  })
  const folderMapping: Record<string, string> = {}
  for (const folder of folders) {
    const { id: oldFolderId, ...rest } = folder
    const newFolder = await prisma.dashboardFolder.create({
      data: { ...rest, workspaceId: newWorkspaceId },
    })
    folderMapping[oldFolderId] = newFolder.id
  }
  return folderMapping
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
    // Removendo o id para permitir que o Prisma gere um novo
    const { id, ...permissionWithoutId } = permission
    return await prisma.profilePermission.create({
      data: { ...permissionWithoutId, userId, workspaceId: newWorkspaceId },
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
  newWorkspaceId: string,
  folderMapping: Record<string, string>
) {
  typebotMapping = {} // Reset do mapeamento

  // Buscar os typebots do workspace original
  const typebots = await prisma.typebot.findMany({
    where: { workspaceId: oldWorkspaceId },
  })

  for (const typebot of typebots) {
    try {
      // Simples cópia inicial do typebot para o novo workspace
      const newTypebot = await prisma.typebot.create({
        data: {
          name: `${typebot.name}`,
          workspaceId: newWorkspaceId,
          icon: typebot.icon,
          groups: typebot.groups as Prisma.InputJsonValue,
          events: typebot.events as Prisma.InputJsonValue,
          variables: typebot.variables as Prisma.InputJsonValue,
          edges: typebot.edges as Prisma.InputJsonValue,
          theme: typebot.theme as Prisma.InputJsonValue,
          settings: typebot.settings as Prisma.InputJsonValue,
          folderId: typebot.folderId ? folderMapping[typebot.folderId] : null,
          originId: typebot.id,
          whatsAppCredentialsId: null,
          version: typebot.version,
          selectedThemeTemplateId: typebot.selectedThemeTemplateId,
          isArchived: typebot.isArchived,
          isClosed: typebot.isClosed,
          resultsTablePreferences:
            typebot.resultsTablePreferences as Prisma.InputJsonValue,
          riskLevel: typebot.riskLevel,
        },
      })

      // Atualizar o publicId concatenando com os 7 últimos caracteres do novo id
      if (typebot.publicId) {
        const newPublicId = `${typebot.publicId}-${newTypebot.id.slice(-7)}`
        await prisma.typebot.update({
          where: { id: newTypebot.id },
          data: { publicId: newPublicId },
        })
      }

      // Armazenar o mapeamento para uso posterior
      typebotMapping[typebot.id] = newTypebot.id
    } catch (error) {
      console.error(`Erro ao duplicar typebot ${typebot.id}:`, error)
    }
  }

  // Após todos os typebots serem duplicados, atualizar os links entre eles
  await updateTypebotLinks(newWorkspaceId)

  return typebotMapping
}

// Função para atualizar os links entre typebots após a duplicação
async function updateTypebotLinks(workspaceId: string) {
  // Buscar todos os typebots do novo workspace
  const newTypebots = await prisma.typebot.findMany({
    where: { workspaceId },
  })

  // Para cada typebot, verificar e atualizar links nos groups
  for (const typebot of newTypebots) {
    if (typebot.groups) {
      let groupsJson = typebot.groups as Group[]
      let needsUpdate = false

      if (Array.isArray(groupsJson)) {
        groupsJson = groupsJson.map((group: Group) => {
          if (group.blocks && Array.isArray(group.blocks)) {
            group.blocks = group.blocks.map((block: Block) => {
              if (
                block.type === LogicBlockType.TYPEBOT_LINK &&
                block.options?.typebotId
              ) {
                const oldLinkedId = block.options.typebotId
                if (typebotMapping[oldLinkedId]) {
                  block.options.typebotId = typebotMapping[oldLinkedId]
                  needsUpdate = true
                }
              }
              return block
            }) as typeof group.blocks
          }
          return group
        })

        // Atualizar o typebot apenas se houve alterações
        if (needsUpdate) {
          await prisma.typebot.update({
            where: { id: typebot.id },
            data: {
              groups: groupsJson as Prisma.InputJsonValue,
            },
          })
        }
      }
    }
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
      status: z.boolean(),
      message: z.string(),
      workspaceId: z.string().optional(),
    })
  )
  .mutation(async ({ input: { workspaceId }, ctx: { user } }) => {
    try {
      // Buscar workspace original
      const oldWorkspace = await prisma.workspace.findFirst({
        where: { id: workspaceId },
        include: { members: true },
      })

      if (!oldWorkspace || isReadWorkspaceFobidden(oldWorkspace, user))
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No workspaces found',
        })

      // Duplicar Workspace (incluindo origem)
      const newWorkspace = await duplicateWorkspaceRecord(oldWorkspace)

      // Duplicar relacionamentos, atualizando as referências para o novo workspace
      const folderMapping = await duplicateDashboardFolders(
        workspaceId,
        newWorkspace.id
      )
      await duplicateCustomDomains(workspaceId, newWorkspace.id)
      await duplicateProfilePermissions(workspaceId, newWorkspace.id, user.id)
      await duplicateProfileInWorkspace(workspaceId, newWorkspace.id)

      // Duplicar typebots usando a nova abordagem que não depende do mutate
      await duplicateTypebots(workspaceId, newWorkspace.id, folderMapping)

      return {
        status: true,
        message: 'Workspace clonado com sucesso!',
        workspaceId: newWorkspace.id,
      }
    } catch (error) {
      console.error('Erro ao clonar workspace:', error)
      return {
        status: false,
        message: `Erro ao clonar workspace: ${(error as Error).message}`,
      }
    }
  })
