import { SetVariableLabel } from '@/components/SetVariableLabel'
import { useTypebot } from '@/features/editor/providers/TypebotProvider'
import { Stack, Text } from '@chakra-ui/react'
import type { WebhookBlock } from '@typebot.io/schemas'
import { isDefined } from '@typebot.io/lib/utils'
import React from 'react'

type Props = {
  options: WebhookBlock['options']
}

export const WebhookNodeContent = ({ options }: Props) => {
  const { typebot } = useTypebot()
  return (
    <Stack>
      <Text noOfLines={1}>Ouça o webhook</Text>
      {typebot &&
        options?.responseVariableMapping
          ?.filter((mapping) => isDefined(mapping.variableId))
          .map((mapping, idx) => (
            <SetVariableLabel
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              key={mapping.variableId! + idx}
              variables={typebot.variables}
              variableId={mapping.variableId ?? ''}
            />
          ))}
    </Stack>
  )
}
