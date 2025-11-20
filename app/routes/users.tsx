// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { UsersScreen } from '~/components/screens/users'
// React router
import type { Route } from './+types/users'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [roles, users] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null, null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_ROLE')
          ? serverConnector
              .readRoles({
                scope: 'PRIMARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null),
        rights.includes('READ_USER')
          ? serverConnector
              .readUsers({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    roles,
    users
  }
}

export default function MetaRoute({
  loaderData: { roles, users }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (
      users === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_USER')
    ) {
      notifier.showError('не удалось загрузить список пользователей')
    }
  }, [users])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_USER') === false ? (
    <ForbiddenScreen />
  ) : (
    <UsersScreen initialRoles={roles} initialUsers={users ?? []} />
  )
}
