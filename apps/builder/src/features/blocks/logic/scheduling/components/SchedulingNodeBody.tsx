import React from 'react'
import { Text } from '@chakra-ui/react'
import type { SchedulingBlock } from '@typebot.io/schemas'

type Props = {
  options: SchedulingBlock['options']
}

export const SchedulingNodeBody = ({
  options: { secondsToWaitFor } = {},
}: Props) => (
  <Text color={secondsToWaitFor ? 'currentcolor' : 'gray.500'} noOfLines={1}>
    {secondsToWaitFor ? `Wait for ${secondsToWaitFor}s` : 'Configure...'}
  </Text>
)
