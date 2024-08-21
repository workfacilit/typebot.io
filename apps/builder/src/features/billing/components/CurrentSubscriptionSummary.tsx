import {
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Skeleton,
  useColorModeValue,
  SimpleGrid,
} from '@chakra-ui/react'
import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Workspace } from '@typebot.io/schemas'
import { TimeFilterDropdown } from '@/features/analytics/components/TimeFilterDropdown'
import {
  defaultTimeFilter,
  timeFilterValues,
} from '@/features/analytics/constants'

type Props = {
  workspace: Pick<Workspace, 'id' | 'plan' | 'stripeId'>
}

export const CurrentSubscriptionSummary = ({ workspace }: Props) => {
  const bg = useColorModeValue('white', 'gray.900')

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const [timeFilter, setTimeFilter] =
    useState<(typeof timeFilterValues)[number]>(defaultTimeFilter)

  const { data: { stats } = {} } =
    trpc.analytics.getTotalWorkspaceMessages.useQuery({
      workspaceId: workspace.id as string,
      timeFilter,
      timeZone,
    })

  return (
    <Stack spacing="4">
      <TimeFilterDropdown
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        backgroundColor={bg}
        boxShadow="md"
      />

      <SimpleGrid columns={2} spacing={10}>
        <Stat bgColor={bg} p="4" rounded="md" boxShadow="md">
          <StatLabel>Mensagens Enviadas</StatLabel>
          {stats ? (
            <StatNumber>{stats.totalOutbound}</StatNumber>
          ) : (
            <Skeleton w="50%" h="10px" mt="2" />
          )}
        </Stat>
        <Stat bgColor={bg} p="4" rounded="md" boxShadow="md">
          <StatLabel>Mensagens Recebidas</StatLabel>
          {stats ? (
            <StatNumber>{stats.totalInbound}</StatNumber>
          ) : (
            <Skeleton w="50%" h="10px" mt="2" />
          )}
        </Stat>
      </SimpleGrid>
    </Stack>
  )
}
