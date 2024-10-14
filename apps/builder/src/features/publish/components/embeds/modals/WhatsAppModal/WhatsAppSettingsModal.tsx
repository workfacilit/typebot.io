import {
  Modal,
  ModalOverlay,
  ModalContent,
  Stack,
  Button,
  Flex,
} from '@chakra-ui/react'
import { SettingsIcon, FolderIcon } from '@/components/icons'
import { useState } from 'react'
import { useParentModal } from '@/features/graph/providers/ParentModalProvider'
import { WhatsAppModal } from './WhatsAppModal'
import { ModalProps } from '../../EmbedButton'
import { WhatsAppTemplates } from './WhatsAppTemplates'

type SettingsTab = 'wpp-settings' | 'templates'

export const WhatsappSettingsModal = ({ isOpen, onClose }: ModalProps) => {
  const { ref } = useParentModal()
  const defaultTab = 'wpp-settings'
  const [selectedTab, setSelectedTab] = useState<SettingsTab>(defaultTab)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent minH="600px" flexDir="row" ref={ref}>
        <Stack
          spacing={8}
          w="180px"
          py="6"
          borderRightWidth={1}
          justifyContent="space-between"
        >
          <Stack spacing={8}>
            <Stack>
              <Button
                variant={selectedTab === 'wpp-settings' ? 'solid' : 'ghost'}
                onClick={() => setSelectedTab('wpp-settings')}
                leftIcon={<SettingsIcon />}
                size="sm"
                justifyContent="flex-start"
                pl="4"
              >
                Conectar Número
              </Button>
              <Button
                variant={selectedTab === 'templates' ? 'solid' : 'ghost'}
                onClick={() => setSelectedTab('templates')}
                leftIcon={<FolderIcon />}
                size="sm"
                justifyContent="flex-start"
                pl="4"
              >
                Templates
              </Button>
            </Stack>
          </Stack>

          <Flex justify="center" pt="10"></Flex>
        </Stack>

        {isOpen && (
          <Flex flex="1" p="10">
            <SettingsContent tab={selectedTab} />
          </Flex>
        )}
      </ModalContent>
    </Modal>
  )
}

const SettingsContent = ({ tab }: { tab: SettingsTab }) => {
  switch (tab) {
    case 'wpp-settings':
      return <WhatsAppModal />
    case 'templates':
      return <WhatsAppTemplates />
    default:
      return null
  }
}
