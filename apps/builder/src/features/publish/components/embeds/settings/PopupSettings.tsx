import { NumberInput } from '@/components/inputs'
import {
  StackProps,
  Stack,
  Heading,
  Switch,
  HStack,
  Text,
} from '@chakra-ui/react'
import { PopupProps } from '@typebot.io/nextjs'
import { useState, useEffect } from 'react'
import { isDefined } from '@typebot.io/lib'

type Props = {
  onUpdateSettings: (windowSettings: Pick<PopupProps, 'autoShowDelay'>) => void
} & StackProps

export const PopupSettings = ({ onUpdateSettings, ...props }: Props) => {
  const [isEnabled, setIsEnabled] = useState(false)
  const [inputValue, setInputValue] = useState(5)

  useEffect(() => {
    onUpdateSettings({
      autoShowDelay: isEnabled ? inputValue * 1000 : undefined,
    })
  }, [inputValue, isEnabled, onUpdateSettings])

  return (
    <Stack {...props} spacing={4}>
      <Heading size="sm">Configurações de pop-up</Heading>

      <HStack pl={4}>
        <Text flexShrink={0}>Auto show</Text>
        <Switch
          isChecked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
        />
        {isEnabled && (
          <>
            <Text>depois de</Text>
            <NumberInput
              size="sm"
              w="70px"
              defaultValue={inputValue}
              onValueChange={(val) => isDefined(val) && setInputValue(val)}
              withVariableButton={false}
            />
            <Text>segundos</Text>
          </>
        )}
      </HStack>
    </Stack>
  )
}
