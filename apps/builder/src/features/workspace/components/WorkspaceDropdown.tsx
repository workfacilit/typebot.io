import { EmojiOrImageIcon } from '@/components/EmojiOrImageIcon'
import {
  HardDriveIcon,
  ChevronLeftIcon,
  PlusIcon,
  LogOutIcon,
} from '@/components/icons'
import { trpc } from '@/lib/trpc'
import { useTranslate } from '@tolgee/react'
import {
  Menu,
  MenuButton,
  Button,
  HStack,
  MenuList,
  MenuItem,
  Text,
} from '@chakra-ui/react'
import { WorkspaceInApp } from '../WorkspaceProvider'
import WithPermission from '@/components/WithPermission'

type Props = {
  currentWorkspace?: WorkspaceInApp
  onWorkspaceSelected: (workspaceId: string) => void
  onCreateNewWorkspaceClick: () => void
  onLogoutClick: () => void
}

export const WorkspaceDropdown = ({
  currentWorkspace,
  onWorkspaceSelected,
  onLogoutClick,
  onCreateNewWorkspaceClick,
}: Props) => {
  const { t } = useTranslate()
  const { data } = trpc.workspace.listWorkspaces.useQuery()

  const workspaces = data?.workspaces ?? []

  const activeLogoff = false

  return (
    <Menu placement="bottom-end">
      <MenuButton as={Button} variant="outline" px="2">
        <HStack>
          {currentWorkspace && (
            <>
              <Text noOfLines={1} maxW="200px">
                {currentWorkspace.name}
              </Text>
            </>
          )}
          <ChevronLeftIcon transform="rotate(-90deg)" />
        </HStack>
      </MenuButton>
      <MenuList>
        {workspaces
          ?.filter((workspace) => workspace.id !== currentWorkspace?.id)
          .map((workspace) => (
            <MenuItem
              key={workspace.id}
              onClick={() => onWorkspaceSelected(workspace.id)}
            >
              <HStack>
                <EmojiOrImageIcon
                  icon={workspace.icon}
                  boxSize="16px"
                  defaultIcon={HardDriveIcon}
                />
                <Text>{workspace.name}</Text>
              </HStack>
            </MenuItem>
          ))}
        <WithPermission permission="canCreateNewWorkspace">
          <MenuItem onClick={onCreateNewWorkspaceClick} icon={<PlusIcon />}>
            {t('workspace.dropdown.newButton.label')}
          </MenuItem>
        </WithPermission>
        {activeLogoff && (
          <>
            <MenuItem
              onClick={onLogoutClick}
              icon={<LogOutIcon />}
              color="orange.500"
            >
              {t('workspace.dropdown.logoutButton.label')}
            </MenuItem>
          </>
        )}
      </MenuList>
    </Menu>
  )
}
