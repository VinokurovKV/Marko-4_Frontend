// Project
import type {
  TagPrimary,
  RequirementsFilter,
  RequirementSecondary,
  TestPrimary,
  SubgroupTertiary,
  GroupPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTagsPrimaryFiltered,
  readRequirementsSecondaryFiltered,
  readTestsPrimaryFiltered,
  readSubgroupTertiary,
  readGroupPrimary
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useRequirementsFilteredSubscription,
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
  const testIds = tests?.map((test) => test.id)
  const [requirements] = await Promise.all([
    readRequirementsSecondaryFiltered(undefined, {
      testIds: testIds
    })
  ])
  return {
    subgroupId,
    tags,
    requirements,
    tests,
    subgroup,
    group
  }
}

function SubgroupRouteInner({
  loaderData: {
    subgroupId,
    tags: initialTags,
    requirements: initialRequirements,
    tests: initialTests,
    subgroup: initialSubgroup,
    group: initialGroup
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [tags, setTags] = React.useState<TagPrimary[] | null>(initialTags)
  const [requirements, setRequirements] = React.useState<
    RequirementSecondary[] | null
  >(initialRequirements)
  const [tests, setTests] = React.useState<TestPrimary[] | null>(initialTests)
  const [subgroup, setSubgroup] = React.useState<SubgroupTertiary | null>(
    initialSubgroup
  )
  const [group, setGroup] = React.useState<GroupPrimary | null>(initialGroup)

  const tagIds = React.useMemo(() => subgroup?.tagIds ?? null, [subgroup])
  const testIds = React.useMemo(() => subgroup?.testIds ?? null, [subgroup])

  const requirementsFilter: RequirementsFilter = React.useMemo(
    () => ({
      testIds: testIds ?? []
    }),
    [testIds]
  )

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useRequirementsFilteredSubscription(
    'UP_TO_SECONDARY_PROPS',
    undefined,
    requirementsFilter,
    setRequirements
  )
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
      requirements={requirements}
      tests={tests}
      subgroup={subgroup}
      group={group}
    />
  ) : null
}

export default function SubgroupRoute(props: Route.ComponentProps) {
  return <SubgroupRouteInner key={props.loaderData.subgroupId} {...props} />
}
