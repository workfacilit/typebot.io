import { Stack, Heading, Text } from '@chakra-ui/react'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import React from 'react'
import { ChangePlanForm } from './ChangePlanForm'
import { CurrentSubscriptionSummary } from './CurrentSubscriptionSummary'

export const BillingSettingsLayout = () => {
  const { workspace, currentRole } = useWorkspace()

  if (!workspace) return null
  return (
    <Stack spacing="10" w="full">
      <Heading fontSize="2xl">Uso de Mensagens</Heading>
      <Text>
        Veja o número de mensagens enviadas e recebidas em todos os fluxos deste
        workspace.
      </Text>
      <Stack spacing="4">
        <CurrentSubscriptionSummary workspace={workspace} />
        <ChangePlanForm workspace={workspace} currentRole={currentRole} />
      </Stack>
    </Stack>
  )
}
