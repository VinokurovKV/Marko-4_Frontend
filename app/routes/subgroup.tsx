// Project
import type {
  TagPrimary,
  TestPrimary,
  SubgroupTertiary,
  GroupPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTagsPrimaryFiltered,
  readTestsPrimaryFiltered,
  readSubgroupTertiary,
  readGroupPrimary
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useTestsFilteredSubscription,
  useSubgroupSubscription,
  useGroupSubscription
} from '~/hooks/resources'
import { SubgroupViewer } from '~/components/single-resource-viewers/resources/subgroup'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/subgroup'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const subgroupId = (() => {
    const parsed = parseInt(params.subgroupId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [subgroup] = await Promise.all([readSubgroupTertiary(subgroupId)])
  const [tags, tests, group] = await Promise.all([
    readTagsPrimaryFiltered(subgroup?.tagIds ?? null),
    readTestsPrimaryFiltered(subgroup?.testIds ?? null),
    readGroupPrimary(subgroup?.groupId ?? null)
  ])
  return {
    subgroupId,
    tags,
    tests,
    subgroup,
    group
  }
}

function SubgroupRouteInner({
  loaderData: {
    subgroupId,
    tags: initialTags,
    tests: initialTests,
    subgroup: initialSubgroup,
    group: initialGroup
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [tags, setTags] = React.useState<TagPrimary[] | null>(initialTags)
  const [tests, setTests] = React.useState<TestPrimary[] | null>(initialTests)
  const [subgroup, setSubgroup] = React.useState<SubgroupTertiary | null>(
    initialSubgroup
  )
  const [group, setGroup] = React.useState<GroupPrimary | null>(initialGroup)

  const tagIds = React.useMemo(() => subgroup?.tagIds ?? null, [subgroup])
  const testIds = React.useMemo(() => subgroup?.testIds ?? null, [subgroup])

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useTestsFilteredSubscription('PRIMARY_PROPS', testIds, setTests)
  useSubgroupSubscription('UP_TO_TERTIARY_PROPS', subgroupId, setSubgroup)
  useGroupSubscription('PRIMARY_PROPS', subgroup?.groupId ?? null, setGroup)

  React.useEffect(() => {
    if (subgroupId === null) {
      notifier.showError(
        'указан некорректный идентификатор подгруппы тестов в URL'
      )
    } else if (
      subgroup === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_SUBGROUP')
    ) {
      notifier.showError(
        `не удалось загрузить подгруппу тестов с идентификатором ${subgroupId}`
      )
    }
  }, [subgroupId, subgroup, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP') === false ? (
    <ForbiddenScreen />
  ) : subgroupId !== null && subgroup !== null ? (
    <SubgroupViewer
      key={subgroupId}
      tags={tags}
      tests={tests}
      subgroup={subgroup}
      group={group}
    />
  ) : null
}

export default function SubgroupRoute(props: Route.ComponentProps) {
  return <SubgroupRouteInner key={props.loaderData.subgroupId} {...props} />
}
