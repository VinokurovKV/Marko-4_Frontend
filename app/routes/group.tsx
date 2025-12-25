// Project
import type {
  TagPrimary,
  RequirementsFilter,
  RequirementSecondary,
  TestsFilter,
  TestSecondary,
  SubgroupPrimary,
  GroupTertiary
} from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTagsPrimaryFiltered,
  readRequirementsSecondaryFiltered,
  readTestsSecondaryFiltered,
  readSubgroupsPrimaryFiltered,
  readGroupTertiary
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useRequirementsFilteredSubscription,
  useTestsFilteredSubscription,
  useSubgroupsFilteredSubscription,
  useGroupSubscription
} from '~/hooks/resources'
import { GroupViewer } from '~/components/single-resource-viewers/resources/group'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/group'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const groupId = (() => {
    const parsed = parseInt(params.groupId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [group] = await Promise.all([readGroupTertiary(groupId)])
  const [tags, subgroups] = await Promise.all([
    readTagsPrimaryFiltered(group?.tagIds ?? null),
    readSubgroupsPrimaryFiltered(group?.subgroupIds ?? null)
  ])
  const subgroupIds = subgroups?.map((subgroup) => subgroup.id) ?? null
  const [tests] = await Promise.all([
    readTestsSecondaryFiltered(undefined, {
      subgroupIds: subgroupIds ?? []
    })
  ])
  const testIds = tests?.map((test) => test.id) ?? null
  const [requirements] = await Promise.all([
    readRequirementsSecondaryFiltered(undefined, {
      testIds: testIds ?? []
    })
  ])
  return {
    groupId,
    tags,
    requirements,
    tests,
    subgroups,
    group
  }
}

function GroupRouteInner({
  loaderData: {
    groupId,
    tags: initialTags,
    requirements: initialRequirements,
    tests: initialTests,
    subgroups: initialSubgroups,
    group: initialGroup
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [tags, setTags] = React.useState<TagPrimary[] | null>(initialTags)
  const [requirements, setRequirements] = React.useState<
    RequirementSecondary[] | null
  >(initialRequirements)
  const [tests, setTests] = React.useState<TestSecondary[] | null>(initialTests)
  const [subgroups, setSubgroups] = React.useState<SubgroupPrimary[] | null>(
    initialSubgroups
  )
  const [group, setGroup] = React.useState<GroupTertiary | null>(initialGroup)

  const tagIds = React.useMemo(() => group?.tagIds ?? null, [group])
  const testIds = React.useMemo(
    () => tests?.map((test) => test.id) ?? null,
    [tests]
  )
  const subgroupIds = React.useMemo(() => group?.subgroupIds ?? null, [group])

  const requirementsFilter: RequirementsFilter = React.useMemo(
    () => ({
      testIds: testIds ?? []
    }),
    [testIds]
  )
  const testsFilter: TestsFilter = React.useMemo(
    () => ({
      subgroupIds: subgroupIds ?? []
    }),
    [subgroupIds]
  )

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useRequirementsFilteredSubscription(
    'UP_TO_SECONDARY_PROPS',
    undefined,
    requirementsFilter,
    setRequirements
  )
  useTestsFilteredSubscription(
    'UP_TO_SECONDARY_PROPS',
    undefined,
    testsFilter,
    setTests
  )
  useSubgroupsFilteredSubscription('PRIMARY_PROPS', subgroupIds, setSubgroups)
  useGroupSubscription('UP_TO_TERTIARY_PROPS', groupId, setGroup)

  React.useEffect(() => {
    if (groupId === null) {
      notifier.showError(
        'указан некорректный идентификатор группы тестов в URL'
      )
    } else if (
      group === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_GROUP')
    ) {
      notifier.showError(
        `не удалось загрузить группу тестов с идентификатором ${groupId}`
      )
    }
  }, [groupId, group, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP') === false ? (
    <ForbiddenScreen />
  ) : groupId !== null && group !== null ? (
    <GroupViewer
      key={groupId}
      tags={tags}
      requirements={requirements}
      tests={tests}
      subgroups={subgroups}
      group={group}
    />
  ) : null
}

export default function GroupRoute(props: Route.ComponentProps) {
  return <GroupRouteInner key={props.loaderData.groupId} {...props} />
}
