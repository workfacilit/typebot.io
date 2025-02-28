import {
  Stack,
  FormControl,
  FormLabel,
  Flex,
  Button,
  useDisclosure,
  Text,
  Input,
  InputGroup,
  InputRightElement,
  FormHelperText,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'
import { ConfirmModal } from '@/components/ConfirmModal'
import React, { useState } from 'react'
import { EditableEmojiOrImageIcon } from '@/components/EditableEmojiOrImageIcon'
import { useWorkspace } from '../WorkspaceProvider'
import { TextInput } from '@/components/inputs'
import { useTranslate } from '@tolgee/react'
import { CopyButton } from '@/components/CopyButton'
import { trpc } from '@/lib/trpc'

export const WorkspaceSettingsForm = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslate()
  const {
    workspace,
    workspaces,
    updateWorkspace,
    deleteCurrentWorkspace,
    switchWorkspace, // Certifique-se de que está incluindo switchWorkspace aqui
  } = useWorkspace()
  const toast = useToast()
  const [isCloning, setIsCloning] = useState(false)
  const [clonedWorkspaceId, setClonedWorkspaceId] = useState<string | null>(
    null
  )

  // Disclosures para os modals
  const {
    isOpen: isConfirmCloneOpen,
    onOpen: onConfirmCloneOpen,
    onClose: onConfirmCloneClose,
  } = useDisclosure()
  const {
    isOpen: isSuccessModalOpen,
    onOpen: onSuccessModalOpen,
    onClose: onSuccessModalClose,
  } = useDisclosure()

  const handleNameChange = (name: string) => {
    if (!workspace?.id) return
    updateWorkspace({ name })
  }

  const handleChangeIcon = (icon: string) => updateWorkspace({ icon })

  const handleDeleteClick = async () => {
    await deleteCurrentWorkspace()
    onClose()
  }

  const duplicateWorkspaceMutation =
    trpc.workspace.duplicateWorkspace.useMutation({
      onSuccess: (data) => {
        setIsCloning(false)
        if (data.status) {
          setClonedWorkspaceId(data.workspaceId || null)
          onSuccessModalOpen() // Abrir modal de sucesso
        } else {
          toast({
            title: 'Erro ao clonar workspace',
            description: data.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        }
      },
      onError: (error) => {
        setIsCloning(false)
        toast({
          title: 'Erro ao clonar workspace',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      },
    })

  const handleCloneWorkspace = () => {
    onConfirmCloneOpen() // Abrir modal de confirmação
  }

  const confirmClone = () => {
    if (!workspace?.id) return
    setIsCloning(true)
    onConfirmCloneClose() // Fechar modal de confirmação
    duplicateWorkspaceMutation.mutate({ workspaceId: workspace.id })
  }

  const navigateToClonedWorkspace = () => {
    if (clonedWorkspaceId) {
      switchWorkspace(clonedWorkspaceId)
    }
    onSuccessModalClose()
  }

  return (
    <Stack spacing="6" w="full">
      <FormControl>
        <FormLabel>{t('workspace.settings.icon.title')}</FormLabel>
        <Flex>
          {workspace && (
            <EditableEmojiOrImageIcon
              uploadFileProps={{
                workspaceId: workspace.id,
                fileName: 'icon',
              }}
              icon={workspace.icon}
              onChangeIcon={handleChangeIcon}
              boxSize="40px"
            />
          )}
        </Flex>
      </FormControl>
      {workspace && (
        <>
          <TextInput
            label={t('workspace.settings.name.label')}
            withVariableButton={false}
            defaultValue={workspace?.name}
            onChange={handleNameChange}
          />
          <FormControl>
            <FormLabel>ID:</FormLabel>
            <InputGroup>
              <Input
                type={'text'}
                defaultValue={workspace.id}
                pr="16"
                readOnly
              />
              <InputRightElement width="72px">
                <CopyButton textToCopy={workspace.id} size="xs" />
              </InputRightElement>
            </InputGroup>
            <FormHelperText>Usado ao interagir com a API.</FormHelperText>
          </FormControl>
        </>
      )}
      {workspace && workspaces && workspaces.length > 1 && (
        <DeleteWorkspaceButton
          onConfirm={handleDeleteClick}
          workspaceName={workspace?.name}
        />
      )}
      <Flex justifyContent="flex-start">
        <Button
          onClick={handleCloneWorkspace}
          isLoading={isCloning}
          loadingText="Clonando..."
          colorScheme="blue"
        >
          Clonar Workspace
        </Button>
      </Flex>

      {/* Modal de confirmação antes de clonar */}
      <Modal isOpen={isConfirmCloneOpen} onClose={onConfirmCloneClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar clonagem</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Você está prestes a criar uma cópia deste workspace. Todos os
            fluxos, pastas e configurações serão duplicados. Deseja continuar?
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onConfirmCloneClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={confirmClone}
              isLoading={isCloning}
            >
              Clonar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de sucesso após a clonagem */}
      <Modal isOpen={isSuccessModalOpen} onClose={onSuccessModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Workspace clonado com sucesso!</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            O workspace foi clonado corretamente. Deseja navegar para o novo
            workspace agora?
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSuccessModalClose}>
              Ficar aqui
            </Button>
            <Button colorScheme="blue" onClick={navigateToClonedWorkspace}>
              Ir para o Workspace
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  )
}

const DeleteWorkspaceButton = ({
  workspaceName,
  onConfirm,
}: {
  workspaceName: string
  onConfirm: () => Promise<void>
}) => {
  const { t } = useTranslate()
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <>
      <Button colorScheme="red" variant="outline" onClick={onOpen}>
        {t('workspace.settings.deleteButton.label')}
      </Button>
      <ConfirmModal
        isOpen={isOpen}
        onConfirm={onConfirm}
        onClose={onClose}
        message={
          <Text>
            {t('workspace.settings.deleteButton.confirmMessage', {
              workspaceName,
            })}
          </Text>
        }
        confirmButtonLabel="Delete"
      />
    </>
  )
}
