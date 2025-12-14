// Project
import type { TagPrimary, CommonTopologyAll, TopologyPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTagsPrimaryFiltered,
  readCommonTopologyAll,
  readTopologiesPrimaryFiltered
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useCommonTopologySubscription,
  useTopologiesFilteredSubscription
} from '~/hooks/resources'
import { CommonTopologyViewer } from '~/components/single-resource-viewers/resources/common-topology'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/common-topology'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const commonTopologyId = (() => {
    const parsed = parseInt(params.commonTopologyId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [commonTopology] = await Promise.all([
    readCommonTopologyAll(commonTopologyId)
  ])
  const [tags, topologies] = await Promise.all([
    readTagsPrimaryFiltered(commonTopology?.tagIds ?? null),
    readTopologiesPrimaryFiltered(commonTopology?.topologyIds ?? null)
  ])
  return {
    commonTopologyId,
    tags,
    commonTopology,
    topologies
  }
}

function CommonTopologyRouteInner({
  loaderData: {
    commonTopologyId,
    tags: initialTags,
    commonTopology: initialCommonTopology,
    topologies: initialTopologies
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [tags, setTags] = React.useState<TagPrimary[] | null>(initialTags)
  const [commonTopology, setCommonTopology] =
    React.useState<CommonTopologyAll | null>(initialCommonTopology)
  const [topologies, setTopologies] = React.useState<TopologyPrimary[] | null>(
    initialTopologies
  )

  const tagIds = React.useMemo(
    () => commonTopology?.tagIds ?? null,
    [commonTopology]
  )
  const topologyIds = React.useMemo(
    () => commonTopology?.topologyIds ?? null,
    [commonTopology]
  )

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useCommonTopologySubscription(
    'ALL_PROPS',
    commonTopologyId,
    setCommonTopology
  )
  useTopologiesFilteredSubscription('PRIMARY_PROPS', topologyIds, setTopologies)

  React.useEffect(() => {
    if (commonTopologyId === null) {
      notifier.showError(
        'указан некорректный идентификатор общей топологии в URL'
      )
    } else if (
      commonTopology === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_COMMON_TOPOLOGY')
    ) {
      notifier.showError(
        `не удалось загрузить общую топологию с идентификатором ${commonTopologyId}`
      )
    }
  }, [commonTopologyId, commonTopology, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COMMON_TOPOLOGY') === false ? (
    <ForbiddenScreen />
  ) : commonTopologyId !== null && commonTopology !== null ? (
    <CommonTopologyViewer
      key={commonTopologyId}
      tags={tags}
      commonTopology={commonTopology}
      topologies={topologies}
    />
  ) : null
}

export default function CommonTopologyRoute(props: Route.ComponentProps) {
  return (
    <CommonTopologyRouteInner
      key={props.loaderData.commonTopologyId}
      {...props}
    />
  )
}
