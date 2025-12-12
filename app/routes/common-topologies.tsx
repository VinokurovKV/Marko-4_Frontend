// Project
import type { CommonTopologySecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readCommonTopologiesSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useCommonTopologiesSubscription } from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { CommonTopologiesScreen } from '~/components/screens/common-topologies'
// React router
import type { Route } from './+types/common-topologies'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [commonTopologies] = await Promise.all([
    readCommonTopologiesSecondary()
  ])
  return {
    commonTopologies
  }
}

export default function CommonTopologiesRoute({
  loaderData: { commonTopologies: initialCommonTopologies }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [commonTopologies, setCommonTopologies] = React.useState<
    CommonTopologySecondary[] | null
  >(initialCommonTopologies)

  useCommonTopologiesSubscription('UP_TO_SECONDARY_PROPS', setCommonTopologies)

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
  ) : commonTopologies !== null ? (
    <CommonTopologiesScreen commonTopologies={commonTopologies} />
  ) : null
}
