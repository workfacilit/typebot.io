import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Stack,
  Text,
  Input,
} from '@chakra-ui/react'
import { useTypebot } from '@/features/editor/providers/TypebotProvider'
import { GroupsDropdown } from './GroupsDropdown'
import { TypebotsDropdown } from './TypebotsDropdown'
import { trpc } from '@/lib/trpc'
import { isNotEmpty } from '@typebot.io/lib'
import { SwitchWithLabel } from '@/components/inputs/SwitchWithLabel'
import type { TypebotLinkBlock } from '@typebot.io/schemas'
import { defaultTypebotLinkOptions } from '@typebot.io/schemas/features/blocks/logic/typebotLink/constants'

type Props = {
  options: TypebotLinkBlock['options']
  onOptionsChange: (options: TypebotLinkBlock['options']) => void
}

export const TypebotLinkForm = ({ options, onOptionsChange }: Props) => {
  const { typebot } = useTypebot()

  const handleTypebotIdChange = async (
    typebotId: string | 'current' | undefined
  ) => onOptionsChange({ ...options, typebotId, groupId: undefined })

  const { data: linkedTypebotData } = trpc.typebot.getTypebot.useQuery(
    {
      typebotId: options?.typebotId as string,
    },
    {
      enabled:
        isNotEmpty(options?.typebotId) && options?.typebotId !== 'current',
    }
  )

  const handleGroupIdChange = (groupId: string | undefined) =>
    onOptionsChange({ ...options, groupId })

  const updateMergeResults = (mergeResults: boolean) =>
    onOptionsChange({ ...options, mergeResults })

  const updateScheduleMinutes = (event: React.ChangeEvent<HTMLInputElement>) =>
    onOptionsChange({
      ...options,
      schedule: { ...options?.schedule, minutes: Number(event.target.value) },
    })

  const updateScheduleActived = (actived: boolean) =>
    onOptionsChange({
      ...options,
      schedule: { ...options?.schedule, actived },
    })

  const isCurrentTypebotSelected =
    (typebot && options?.typebotId === typebot.id) ||
    options?.typebotId === 'current'

  return (
    <Stack>
      {typebot && (
        <TypebotsDropdown
          idsToExclude={[typebot.id]}
          typebotId={options?.typebotId}
          onSelect={handleTypebotIdChange}
          currentWorkspaceId={typebot.workspaceId as string}
        />
      )}
      {options?.typebotId && (
        <GroupsDropdown
          key={options.typebotId}
          groups={
            typebot && isCurrentTypebotSelected
              ? typebot.groups
              : linkedTypebotData?.typebot?.groups ?? []
          }
          groupId={options.groupId}
          onGroupIdSelected={handleGroupIdChange}
          isLoading={
            linkedTypebotData?.typebot === undefined &&
            options.typebotId !== 'current' &&
            typebot &&
            typebot.id !== options.typebotId
          }
        />
      )}
      {!isCurrentTypebotSelected && (
        <SwitchWithLabel
          label="Mesclar respostas"
          moreInfoContent="Se habilitado, as respostas coletadas no typebot vinculado serão mescladas com os resultados do typebot atual."
          initialValue={
            options?.mergeResults ?? defaultTypebotLinkOptions.mergeResults
          }
          onCheckChange={updateMergeResults}
        />
      )}
      <Accordion allowToggle>
        <AccordionItem>
          <AccordionButton justifyContent="space-between">
            Agendamento
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel py="1">
            <Stack p="1" borderRadius="md" spacing="3">
              <Text fontSize="sm">
                Configure uma transição programada minutos depois que o usuário
                interagir com o bot.(Para Whatsapp)
              </Text>
            </Stack>
            <Input
              mb="2"
              mt="2"
              defaultValue={options?.schedule?.minutes}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (value >= 1 && value <= 60) {
                  updateScheduleMinutes(event)
                }
              }}
              type="number"
              min={1}
              max={60}
            />
            <SwitchWithLabel
              mb="2"
              mt="2"
              label="Ativar agendamento"
              initialValue={options?.schedule?.actived}
              onCheckChange={updateScheduleActived}
            />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Stack>
  )
}
