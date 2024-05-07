import { MotionStack } from '@/components/MotionStack'
import { Stack, Button, StackProps, Text, ButtonProps } from '@chakra-ui/react'
import { StandardIllustration } from './illustrations/StandardIllustration'

type Props = StackProps & Pick<ButtonProps, 'isDisabled'>

export const StandardMenuButton = (props: Props) => {
  return (
    <MotionStack
      as={Button}
      fontWeight="normal"
      alignItems="center"
      variant="outline"
      colorScheme="gray"
      whiteSpace={'normal'}
      spacing="6"
      height="250px"
      flex="1"
      animate="default"
      whileHover="animateBubbles"
      transition={{ staggerChildren: 0.1 }}
      {...props}
    >
      <StandardIllustration />
      <Stack>
        <Text fontSize="lg" fontWeight="semibold">
          Padrão
        </Text>
        <Text textColor="gray.500">Incorpore em um contêiner em seu site</Text>
      </Stack>
    </MotionStack>
  )
}
