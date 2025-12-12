// Project
import type { RoleSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readRolesSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useRolesSubscription } from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { RolesScreen } from '~/components/screens/roles'
// React router
import type { Route } from './+types/roles'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [roles] = await Promise.all([readRolesSecondary()])
  return {
    roles
  }
}

export default function RolesRoute({
  loaderData: { roles: initialRoles }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [roles, setRoles] = React.useState<RoleSecondary[] | null>(initialRoles)

  useRolesSubscription('UP_TO_SECONDARY_PROPS', setRoles)

  React.useEffect(() => {
    if (
      roles === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_ROLE')
    ) {
      notifier.showError('не удалось загрузить список ролей')
    }
  }, [roles, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_ROLE') === false ? (
    <ForbiddenScreen />
  ) : roles !== null ? (
    <RolesScreen roles={roles} />
  ) : null
}
