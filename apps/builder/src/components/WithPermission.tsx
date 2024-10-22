import React, { ReactNode } from 'react'
import { useUserPermissions } from '@/hooks/useUserPermissions'

interface WithPermissionProps {
  permission: string
  children: ReactNode
}

interface Permissions {
  [key: string]: boolean
}

const WithPermission: React.FC<WithPermissionProps> = ({
  permission,
  children,
}) => {
  const permissions: Permissions = useUserPermissions()

  if (!permissions[permission]) {
    return null // Não renderiza nada se a permissão não for concedida
  }

  return <>{children}</>
}

export default WithPermission
