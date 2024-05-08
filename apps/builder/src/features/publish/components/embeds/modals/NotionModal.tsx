import { AlertInfo } from '@/components/AlertInfo'
import { CopyButton } from '@/components/CopyButton'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Heading,
  ModalCloseButton,
  ModalBody,
  OrderedList,
  ListItem,
  Code,
  InputGroup,
  Input,
  InputRightElement,
  ModalFooter,
  Text,
  Stack,
} from '@chakra-ui/react'
import { ModalProps } from '../EmbedButton'
import { env } from '@typebot.io/env'

export const NotionModal = ({
  isPublished,
  publicId,
  isOpen,
  onClose,
}: ModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Heading size="md">Notion</Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isPublished && (
            <AlertInfo mb="4">
              Você precisa publicar seu bot primeiro.
            </AlertInfo>
          )}
          <OrderedList spacing={4}>
            <ListItem>
              Ao adicionar o Tipo <Code>/embed</Code> na sua pagina
            </ListItem>
            <ListItem>
              <Stack>
                <Text>Cole a URL do seu chatbot</Text>
                <InputGroup size="sm">
                  <Input
                    type={'text'}
                    defaultValue={`${env.NEXT_PUBLIC_VIEWER_URL[0]}/${publicId}`}
                  />
                  <InputRightElement width="60px">
                    <CopyButton
                      size="sm"
                      textToCopy={`${env.NEXT_PUBLIC_VIEWER_URL[0]}/${publicId}`}
                    />
                  </InputRightElement>
                </InputGroup>
              </Stack>
            </ListItem>
          </OrderedList>
        </ModalBody>
        <ModalFooter />
      </ModalContent>
    </Modal>
  )
}
