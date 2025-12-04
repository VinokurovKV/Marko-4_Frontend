// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TopologiesScreen } from '~/components/screens/topologies'
// React router
import type { Route } from './+types/topologies'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [commonTopologies, topologies] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null, null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_COMMON_TOPOLOGY')
          ? serverConnector
              .readCommonTopologies({
                scope: 'PRIMARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null),
        rights.includes('READ_TOPOLOGY')
          ? serverConnector
              .readTopologies({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    commonTopologies,
    topologies
  }
}

export default function MetaRoute({
  loaderData: { commonTopologies, topologies }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (
      topologies === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TOPOLOGY')
    ) {
      notifier.showError('не удалось загрузить список топологий')
    }
  }, [topologies, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TOPOLOGY') === false ? (
    <ForbiddenScreen />
  ) : (
    <TopologiesScreen
      initialCommonTopologies={commonTopologies}
      initialTopologies={topologies ?? []}
    />
  )
}
