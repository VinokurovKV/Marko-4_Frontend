// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { CommonTopologiesScreen } from '~/components/screens/common-topologies'
// React router
import type { Route } from './+types/common-topologies'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [commonTopologies] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_COMMON_TOPOLOGY')
          ? serverConnector
              .readCommonTopologies({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    commonTopologies
  }
}

export default function MetaRoute({
  loaderData: { commonTopologies }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (
      commonTopologies === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_COMMON_TOPOLOGY')
    ) {
      notifier.showError('не удалось загрузить список общих топологий')
    }
  }, [commonTopologies, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COMMON_TOPOLOGY') === false ? (
    <ForbiddenScreen />
  ) : (
    <CommonTopologiesScreen initialCommonTopologies={commonTopologies ?? []} />
  )
}
