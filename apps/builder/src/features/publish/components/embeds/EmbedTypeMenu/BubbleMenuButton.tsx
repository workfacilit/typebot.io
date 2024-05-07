import { MotionStack } from '@/components/MotionStack'
import { Stack, Button, StackProps, Text, ButtonProps } from '@chakra-ui/react'
import { BubbleIllustration } from './illustrations/BubbleIllustration'

type Props = StackProps & Pick<ButtonProps, 'isDisabled'>

export const BubbleMenuButton = (props: Props) => {
  return (
    <MotionStack
      as={Button}
      fontWeight="normal"
      alignItems="center"
      variant="outline"
      colorScheme="gray"
      whiteSpace={'normal'}
      spacing="6"
      flex="1"
      height="250px"
      animate="default"
      whileHover="animateBubbles"
      transition={{ staggerChildren: 0.1 }}
      {...props}
    >
      <BubbleIllustration />
      <Stack>
        <Text fontSize="lg" fontWeight="semibold">
          Balão
        </Text>
        <Text textColor="gray.500">Incorporar em um balão de bate-papo</Text>
      </Stack>
    </MotionStack>
  )
}
