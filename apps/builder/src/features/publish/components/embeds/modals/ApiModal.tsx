import { AlertInfo } from '@/components/AlertInfo'
import { CodeEditor } from '@/components/inputs/CodeEditor'
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
  ModalFooter,
  Text,
  Stack,
} from '@chakra-ui/react'
import { ModalProps } from '../EmbedButton'
import { parseApiHost } from '../snippetParsers/shared'
import { useTypebot } from '@/features/editor/providers/TypebotProvider'

export const ApiModal = ({
  isPublished,
  publicId,
  isOpen,
  onClose,
}: ModalProps): JSX.Element => {
  const { typebot } = useTypebot()

  const replyBody = `{
  "message": "Esta é a minha resposta"
}`

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Heading size="md">API</Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody as={Stack} spacing="6">
          {!isPublished && (
            <AlertInfo>Você precisa publicar seu bot primeiro.</AlertInfo>
          )}
          <OrderedList spacing={4} pl="4">
            <ListItem>
              <Stack>
                <Text>
                  Para iniciar o chat, envie uma solicitação <Code>POST</Code>{' '}
                  para
                </Text>
                <CodeEditor
                  isReadOnly
                  lang={'shell'}
                  value={`${parseApiHost(
                    typebot?.customDomain
                  )}/api/v1/typebots/${publicId}/startChat`}
                />
              </Stack>
            </ListItem>
            <ListItem>
              A primeira resposta conterá um <Code>sessionId</Code> que você
              precisará para solicitações subsequentes.
            </ListItem>
            <ListItem>
              <Stack>
                <Text>
                  Para enviar respostas, envie solicitações <Code>POST</Code>{' '}
                  para
                </Text>
                <CodeEditor
                  isReadOnly
                  lang={'shell'}
                  value={`${parseApiHost(
                    typebot?.customDomain
                  )}/api/v1/sessions/<ID_DA_PRIMEIRA_RESPOSTA>/continueChat`}
                />
                <Text>Com o seguinte corpo JSON:</Text>
                <CodeEditor isReadOnly lang={'json'} value={replyBody} />
                <Text>
                  Substitua <Code>{'<ID_DA_PRIMEIRA_RESPOSTA>'}</Code> pela{' '}
                  <Code>sessionId</Code>.
                </Text>
              </Stack>
            </ListItem>
          </OrderedList>
        </ModalBody>
        <ModalFooter />
      </ModalContent>
    </Modal>
  )
}
