// Project
import type {
  TagPrimary,
  CommonTopologyTertiary,
  TopologyAll,
  TestPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTagsPrimaryFiltered,
  readCommonTopologyTertiary,
  readTopologyAll,
  readTestsPrimaryFiltered
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useCommonTopologySubscription,
  useTopologySubscription,
  useTestsFilteredSubscription
} from '~/hooks/resources'
import { TopologyViewer } from '~/components/single-resource-viewers/resources/topology'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/topology'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const topologyId = (() => {
    const parsed = parseInt(params.topologyId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [topology] = await Promise.all([readTopologyAll(topologyId)])
  const [tags, commonTopology, tests] = await Promise.all([
    readTagsPrimaryFiltered(topology?.tagIds ?? null),
    readCommonTopologyTertiary(topology?.commonTopologyId ?? null),
    readTestsPrimaryFiltered(topology?.testIds ?? null)
  ])
  return {
    topologyId,
    tags,
    commonTopology,
    topology,
    tests
  }
}

function TopologyRouteInner({
  loaderData: {
    topologyId,
    tags: initialTags,
    commonTopology: initialCommonTopology,
    topology: initialTopology,
    tests: initialTests
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [tags, setTags] = React.useState<TagPrimary[] | null>(initialTags)
  const [commonTopology, setCommonTopology] =
    React.useState<CommonTopologyTertiary | null>(initialCommonTopology)
  const [topology, setTopology] = React.useState<TopologyAll | null>(
    initialTopology
  )
  const [tests, setTests] = React.useState<TestPrimary[] | null>(initialTests)

  const tagIds = React.useMemo(() => topology?.tagIds ?? null, [topology])
  const testIds = React.useMemo(() => topology?.testIds ?? null, [topology])

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useCommonTopologySubscription(
    'UP_TO_TERTIARY_PROPS',
    topology?.commonTopologyId ?? null,
    setCommonTopology
  )
  useTopologySubscription('ALL_PROPS', topologyId, setTopology)
  useTestsFilteredSubscription('PRIMARY_PROPS', testIds, null, setTests)

  React.useEffect(() => {
    if (topologyId === null) {
      notifier.showError('указан некорректный идентификатор топологии в URL')
    } else if (
      topology === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TOPOLOGY')
    ) {
      notifier.showError(
        `не удалось загрузить топологию с идентификатором ${topologyId}`
      )
    }
  }, [topologyId, topology, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TOPOLOGY') === false ? (
    <ForbiddenScreen />
  ) : topologyId !== null && topology !== null ? (
    <TopologyViewer
      key={topologyId}
      tags={tags}
      commonTopology={commonTopology}
      topology={topology}
      tests={tests}
    />
  ) : null
}

export default function TopologyRoute(props: Route.ComponentProps) {
  return <TopologyRouteInner key={props.loaderData.topologyId} {...props} />
}
