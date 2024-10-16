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
import { useTypebot } from '@/features/editor/providers/TypebotProvider'
import { WhatsAppAddTemplate } from './WhatsAppAddTemplate'
import { SettingsTab } from '@/features/publish/types/SettingsTab'

export const WhatsappSettingsModal = ({ isOpen, onClose }: ModalProps) => {
  const { ref } = useParentModal()
  const defaultTab = 'wpp-settings'
  const [selectedTab, setSelectedTab] = useState<SettingsTab>(defaultTab)
  const { typebot } = useTypebot()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent minH="800px" flexDir="row" ref={ref}>
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
              {typebot?.whatsAppCredentialsId && (
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
              )}
            </Stack>
          </Stack>

          <Flex justify="center" pt="10"></Flex>
        </Stack>

        {isOpen && (
          <Flex flex="1" p="10">
            <SettingsContent
              tab={selectedTab}
              setSelectedTab={setSelectedTab}
            />
          </Flex>
        )}
      </ModalContent>
    </Modal>
  )
}

const SettingsContent = ({
  tab,
  setSelectedTab,
}: {
  tab: SettingsTab
  setSelectedTab: React.Dispatch<React.SetStateAction<SettingsTab>>
}) => {
  switch (tab) {
    case 'wpp-settings':
      return <WhatsAppModal />
    case 'templates':
      return <WhatsAppTemplates setSelectedTab={setSelectedTab} />
    case 'add-template':
      return <WhatsAppAddTemplate />
    default:
      return null
  }
}
