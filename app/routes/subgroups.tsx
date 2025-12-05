// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { SubgroupsScreen } from '~/components/screens/subgroups'
// React router
import type { Route } from './+types/subgroups'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [subgroups, groups] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null, null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_SUBGROUP')
          ? serverConnector
              .readSubgroups({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null),
        rights.includes('READ_GROUP')
          ? serverConnector
              .readGroups({
                scope: 'PRIMARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    subgroups,
    groups
  }
}

export default function MetaRoute({
  loaderData: { subgroups, groups }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (
      subgroups === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_SUBGROUP')
    ) {
      notifier.showError('не удалось загрузить список подгрупп тестов')
    }
  }, [subgroups, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP') === false ? (
    <ForbiddenScreen />
  ) : (
    <SubgroupsScreen
      initialSubgroups={subgroups ?? []}
      initialGroups={groups}
    />
  )
}
