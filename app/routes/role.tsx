// Project
import type { RoleTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readRoleTertiary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useRoleSubscription } from '~/hooks/resources'
import { RoleViewer } from '~/components/single-resource-viewers/resources/role'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/role'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const roleId = (() => {
    const parsed = parseInt(params.roleId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [role] = await Promise.all([readRoleTertiary(roleId)])
  return {
    roleId,
    role
  }
}

function RoleRouteInner({
  loaderData: { roleId, role: initialRole }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [role, setRole] = React.useState<RoleTertiary | null>(initialRole)

  useRoleSubscription('UP_TO_TERTIARY_PROPS', roleId, setRole)

  React.useEffect(() => {
    if (roleId === null) {
      notifier.showError('указан некорректный идентификатор роли в URL')
    } else if (
      role === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_ROLE')
    ) {
      notifier.showError(
        `не удалось загрузить роль с идентификатором ${roleId}`
      )
    }
  }, [roleId, role, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_ROLE') === false ? (
    <ForbiddenScreen />
  ) : roleId !== null && role !== null ? (
    <RoleViewer key={roleId} role={role} />
  ) : null
}

export default function RoleRoute(props: Route.ComponentProps) {
  return <RoleRouteInner key={props.loaderData.roleId} {...props} />
}
