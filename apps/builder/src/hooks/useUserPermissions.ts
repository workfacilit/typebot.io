import { useWorkspace } from '@/features/workspace/WorkspaceProvider'

function useUserPermissions() {
  const { permissions } = useWorkspace()

  return permissions || {}
}

export { useUserPermissions }
