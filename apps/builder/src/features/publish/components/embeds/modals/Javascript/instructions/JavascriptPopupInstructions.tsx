import { Stack, Code, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { PopupSettings } from '../../../settings/PopupSettings'
import { JavascriptPopupSnippet } from '../JavascriptPopupSnippet'

export const JavascriptPopupInstructions = () => {
  const [inputValue, setInputValue] = useState<number>()

  return (
    <Stack spacing={4}>
      <PopupSettings
        onUpdateSettings={(settings) => setInputValue(settings.autoShowDelay)}
      />
      <Text>
        Cole isso em qualquer lugar do <Code>{'<body>'}</Code>:
      </Text>
      <JavascriptPopupSnippet autoShowDelay={inputValue} />
    </Stack>
  )
}
