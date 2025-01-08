import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Stack,
} from '@chakra-ui/react'
import React from 'react'
import { TextInput } from '@/components/inputs'
import { SwitchWithLabel } from '@/components/inputs/SwitchWithLabel'
import { SchedulingBlock } from '@typebot.io/schemas'
import { defaultWaitOptions } from '@typebot.io/schemas/features/blocks/logic/wait/constants'

type Props = {
  options: SchedulingBlock['options']
  onOptionsChange: (options: SchedulingBlock['options']) => void
}

export const SchedulingSettings = ({ options, onOptionsChange }: Props) => {
  const handleSecondsChange = (secondsToWaitFor: string | undefined) => {
    onOptionsChange({ ...options, secondsToWaitFor })
  }

  const updateShouldPause = (shouldPause: boolean) => {
    onOptionsChange({ ...options, shouldPause })
  }

  return (
    <Stack spacing={4}>
      <TextInput
        label="Minutos do evento(Max. 60):"
        defaultValue={options?.secondsToWaitFor}
        onChange={handleSecondsChange}
      />
      <Accordion allowToggle>
        <AccordionItem>
          <AccordionButton justifyContent="space-between">
            Avançado
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel py="4">
            <SwitchWithLabel
              label="Sessão finalizada"
              moreInfoContent="Verifica se a sessão esta finalizada para realizar o disparo agendado."
              initialValue={
                options?.shouldPause ?? defaultWaitOptions.shouldPause
              }
              onCheckChange={updateShouldPause}
            />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Stack>
  )
}
