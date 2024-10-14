import {
  Modal,
  ModalOverlay,
  ModalContent,
  Stack,
  Text,
  Button,
  Flex,
} from '@chakra-ui/react'
import {
  HardDriveIcon,
  SettingsIcon,
  // UsersIcon,
  InfoIcon,
  GlobeIcon,
  FolderIcon,
} from '@/components/icons'
import { EmojiOrImageIcon } from '@/components/EmojiOrImageIcon'
import { User, WorkspaceRole } from '@typebot.io/prisma'
import { useState } from 'react'
import { MembersList } from './MembersList'
import { WorkspaceSettingsForm } from './WorkspaceSettingsForm'
import { WorkspaceInApp, useWorkspace } from '../WorkspaceProvider'
import packageJson from '../../../../../../package.json'
import { UserPreferencesForm } from '@/features/account/components/UserPreferencesForm'
import { MyAccountForm } from '@/features/account/components/MyAccountForm'
import { BillingSettingsLayout } from '@/features/billing/components/BillingSettingsLayout'
import { useTranslate } from '@tolgee/react'
import { useParentModal } from '@/features/graph/providers/ParentModalProvider'
import { CredentialsSettingsForm } from '@/features/credentials/components/CredentialsSettingsForm'
import WithPermission from '@/components/WithPermission'

type Props = {
  isOpen: boolean
  user: User
  workspace: WorkspaceInApp
  defaultTab?: SettingsTab
  onClose: () => void
}

type SettingsTab =
  | 'my-account'
  | 'user-settings'
  | 'workspace-settings'
  | 'members'
  | 'billing'
  | 'credentials'

export const WorkspaceSettingsModal = ({
  isOpen,
  workspace,
  defaultTab = 'my-account',
  onClose,
}: Props) => {
  const { t } = useTranslate()
  const { ref } = useParentModal()
  const { currentRole } = useWorkspace()
  const [selectedTab, setSelectedTab] = useState<SettingsTab>(defaultTab)

  const canEditWorkspace = currentRole === WorkspaceRole.ADMIN

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
                variant={selectedTab === 'user-settings' ? 'solid' : 'ghost'}
                onClick={() => setSelectedTab('user-settings')}
                leftIcon={<SettingsIcon />}
                size="sm"
                justifyContent="flex-start"
                pl="4"
              >
                {t('workspace.settings.modal.menu.preferences.label')}
              </Button>
              {canEditWorkspace && (
                <Button
                  variant={
                    selectedTab === 'workspace-settings' ? 'solid' : 'ghost'
                  }
                  onClick={() => setSelectedTab('workspace-settings')}
                  leftIcon={
                    <EmojiOrImageIcon
                      icon={workspace.icon}
                      boxSize="15px"
                      defaultIcon={HardDriveIcon}
                    />
                  }
                  size="sm"
                  justifyContent="flex-start"
                  pl="4"
                >
                  {t('workspace.settings.modal.menu.settings.label')}
                </Button>
              )}
              <Button
                variant={selectedTab === 'my-account' ? 'solid' : 'ghost'}
                onClick={() => setSelectedTab('my-account')}
                leftIcon={<GlobeIcon />}
                size="sm"
                justifyContent="flex-start"
                pl="4"
              >
                {t('workspace.settings.modal.menu.myAccount.label')}
              </Button>
              <Button
                variant={selectedTab === 'credentials' ? 'solid' : 'ghost'}
                onClick={() => setSelectedTab('credentials')}
                leftIcon={<FolderIcon />}
                size="sm"
                justifyContent="flex-start"
                pl="4"
              >
                Credenciais
              </Button>
              <WithPermission permission="canViewResults">
                <Button
                  variant={selectedTab === 'billing' ? 'solid' : 'ghost'}
                  onClick={() => setSelectedTab('billing')}
                  leftIcon={<InfoIcon />}
                  size="sm"
                  justifyContent="flex-start"
                  pl="4"
                >
                  Monitorar Uso
                </Button>
              </WithPermission>
            </Stack>
          </Stack>

          <Flex justify="center" pt="10">
            <Text color="gray.500" fontSize="xs">
              {t('workspace.settings.modal.menu.version.label', {
                version: packageJson.version,
              })}
            </Text>
          </Flex>
        </Stack>

        {isOpen && (
          <Flex flex="1" p="10">
            <SettingsContent tab={selectedTab} onClose={onClose} />
          </Flex>
        )}
      </ModalContent>
    </Modal>
  )
}

const SettingsContent = ({
  tab,
  onClose,
}: {
  tab: SettingsTab
  onClose: () => void
}) => {
  switch (tab) {
    case 'my-account':
      return <MyAccountForm />
    case 'user-settings':
      return <UserPreferencesForm />
    case 'workspace-settings':
      return <WorkspaceSettingsForm onClose={onClose} />
    case 'members':
      return <MembersList />
    case 'billing':
      return <BillingSettingsLayout />
    case 'credentials':
      return <CredentialsSettingsForm />
    default:
      return null
  }
}
