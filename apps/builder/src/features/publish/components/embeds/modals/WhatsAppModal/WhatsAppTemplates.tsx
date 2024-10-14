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
} from '@chakra-ui/react'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import React from 'react'

export const WhatsAppTemplates = () => {
  const { workspace } = useWorkspace()

  if (!workspace) return null
  return (
    <Stack spacing="10" w="full">
      <Heading fontSize="2xl">Templates</Heading>
      <Text>Configure os templates referente ao número configurado.</Text>
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
              <Tr>
                <Td>inches</Td>
                <Td>millimetres (mm)</Td>
                <Td>25.4</Td>
                <Td>into</Td>
                <Td>into</Td>
              </Tr>
              <Tr>
                <Td>feet</Td>
                <Td>centimetres (cm)</Td>
                <Td>30.48</Td>
                <Td>into</Td>
                <Td>into</Td>
              </Tr>
              <Tr>
                <Td>yards</Td>
                <Td>metres (m)</Td>
                <Td>0.91444</Td>
                <Td>into</Td>
                <Td>into</Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      </Stack>
    </Stack>
  )
}
