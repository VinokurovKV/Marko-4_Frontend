// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { RolesScreen } from '~/components/screens/roles'
// React router
import type { Route } from './+types/roles'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [roles] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null, null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_ROLE')
          ? serverConnector
              .readRoles({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    roles
  }
}

export default function MetaRoute({
  loaderData: { roles }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

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
  ) : (
    <RolesScreen initialRoles={roles ?? []} />
  )
}
