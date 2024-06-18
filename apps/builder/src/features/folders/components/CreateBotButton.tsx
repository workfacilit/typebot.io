import { Button, ButtonProps, Text, VStack } from '@chakra-ui/react'
import { PlusIcon } from '@/components/icons'
import { useRouter } from 'next/router'
import { stringify } from 'qs'
import React from 'react'
import { useTranslate } from '@tolgee/react'
import { useTypebotDnd } from '../TypebotDndProvider'

export const CreateBotButton = ({
  folderId,
  ...props
}: { folderId?: string } & ButtonProps) => {
  const { t } = useTranslate()
  const router = useRouter()
  const { draggedTypebot } = useTypebotDnd()

  const handleClick = () =>
    router.push(
      `/typebots/create?${stringify({
        folderId,
      })}`
    )

  return (
    <Button
      style={{
        width: '225px',
        height: '270px',
        backgroundColor: 'rgb(227, 242, 253)',
        color: 'rgb(17, 114, 209)',
      }}
      onClick={handleClick}
      paddingX={6}
      whiteSpace={'normal'}
      opacity={draggedTypebot ? 0.6 : 5}
      {...props}
    >
      <VStack spacing="6">
        <PlusIcon fontSize="40px" />
        <Text
          fontSize={18}
          fontWeight="medium"
          maxW={40}
          textAlign="center"
          mt="6"
        >
          {t('folders.createTypebotButton.label')}
        </Text>
      </VStack>
    </Button>
  )
}
