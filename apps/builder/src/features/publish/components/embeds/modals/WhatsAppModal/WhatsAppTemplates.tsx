import {
  Stack,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  Menu,
} from '@chakra-ui/react'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import React from 'react'
import { EditIcon, PlusIcon, TrashIcon, EyeIcon } from '@/components/icons'
import { SettingsTab } from '@/features/publish/types/SettingsTab'
import { trpc } from '@/lib/trpc'
import { useTypebot } from '@/features/editor/providers/TypebotProvider'

export const WhatsAppTemplates = ({
  setSelectedTab,
}: {
  setSelectedTab: React.Dispatch<React.SetStateAction<SettingsTab>>
}) => {
  const { workspace } = useWorkspace()
  const { typebot } = useTypebot()

  const templates = trpc.whatsAppInternal.getAllTemplates.useQuery(
    {
      credentialsId: typebot?.whatsAppCredentialsId as string,
    },
    {
      enabled: !!typebot?.whatsAppCredentialsId,
    }
  )

  if (!workspace) return null
  return (
    <Stack spacing="10" w="full">
      <Heading fontSize="2xl">Templates</Heading>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Text>Configure os templates referente ao número configurado.</Text>
        <Menu isLazy>
          <Button
            as={Button}
            size="sm"
            onClick={() => setSelectedTab('add-template')}
            leftIcon={<PlusIcon />}
          >
            Adicionar
          </Button>
        </Menu>
      </Stack>
      <Stack spacing="4">
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>NOME</Th>
                <Th>CATEGORIA</Th>
                <Th>IDIOMA</Th>
                <Th>STATUS</Th>
                <Th>AÇÕES</Th>
              </Tr>
            </Thead>
            <Tbody>
              {templates.data?.map((template) => (
                <Tr key={template.id}>
                  <Td>{template.name}</Td>
                  <Td>{template.components[0]?.type}</Td>
                  <Td>{template.language}</Td>
                  <Td>{template.status}</Td>
                  <Td>
                    <Button size="xs" mr="2">
                      <EyeIcon />
                    </Button>
                    <Button size="xs" mr="2">
                      <EditIcon />
                    </Button>
                    <Button style={{ color: 'red' }} size="xs">
                      <TrashIcon />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Stack>
    </Stack>
  )
}
