// Project
import type { RolePrimary, UserSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readRolesPrimary, readUsersSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useRolesSubscription, useUsersSubscription } from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { UsersScreen } from '~/components/screens/users'
// React router
import type { Route } from './+types/users'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [roles, users] = await Promise.all([
    readRolesPrimary(),
    readUsersSecondary()
  ])
  return {
    roles,
    users
  }
}

export default function UsersRoute({
  loaderData: { roles: initialRoles, users: initialUsers }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [roles, setRoles] = React.useState<RolePrimary[] | null>(initialRoles)
  const [users, setUsers] = React.useState<UserSecondary[] | null>(initialUsers)

  useRolesSubscription('PRIMARY_PROPS', setRoles)
  useUsersSubscription('UP_TO_SECONDARY_PROPS', setUsers)

  React.useEffect(() => {
    if (
      users === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_USER')
    ) {
      notifier.showError('не удалось загрузить список пользователей')
    }
  }, [users, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_USER') === false ? (
    <ForbiddenScreen />
  ) : users !== null ? (
    <UsersScreen roles={roles} users={users} />
  ) : null
}
