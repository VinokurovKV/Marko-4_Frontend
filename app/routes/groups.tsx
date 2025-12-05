// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { GroupsScreen } from '~/components/screens/groups'
// React router
import type { Route } from './+types/groups'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [groups] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_GROUP')
          ? serverConnector
              .readGroups({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    groups
  }
}

export default function MetaRoute({
  loaderData: { groups }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (
      groups === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_GROUP')
    ) {
      notifier.showError('не удалось загрузить список групп тестов')
    }
  }, [groups, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP') === false ? (
    <ForbiddenScreen />
  ) : (
    <GroupsScreen initialGroups={groups ?? []} />
  )
}
