// Project
import type { CommonTopologyPrimary, TopologySecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readCommonTopologiesPrimary, readTopologiesSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useCommonTopologiesSubscription,
  useTopologiesSubscription
} from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TopologiesScreen } from '~/components/screens/topologies'
// React router
import type { Route } from './+types/topologies'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [commonTopologies, topologies] = await Promise.all([
    readCommonTopologiesPrimary(),
    readTopologiesSecondary()
  ])
  return {
    commonTopologies,
    topologies
  }
}

export default function TopologiesRoute({
  loaderData: {
    commonTopologies: initialCommonTopologies,
    topologies: initialTopologies
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [commonTopologies, setCommonTopologies] = React.useState<
    CommonTopologyPrimary[] | null
  >(initialCommonTopologies)
  const [topologies, setTopologies] = React.useState<
    TopologySecondary[] | null
  >(initialTopologies)

  useCommonTopologiesSubscription('PRIMARY_PROPS', setCommonTopologies)
  useTopologiesSubscription('UP_TO_SECONDARY_PROPS', setTopologies)

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
  ) : topologies !== null ? (
    <TopologiesScreen
      commonTopologies={commonTopologies}
      topologies={topologies}
    />
  ) : null
}
