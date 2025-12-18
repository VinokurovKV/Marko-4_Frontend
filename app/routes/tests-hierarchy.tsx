// Project
import type { TestSecondary, SubgroupSecondary, GroupPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTestsSecondary,
  readSubgroupsSecondary,
  readGroupsPrimary
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTestsSubscription,
  useSubgroupsSubscription,
  useGroupsSubscription
} from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TestsHierarchyScreen } from '~/components/screens/tests-hierarchy'
// React router
import type { Route } from './+types/tests-hierarchy'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [tests, subgroups, groups] = await Promise.all([
    readTestsSecondary(),
    readSubgroupsSecondary(),
    readGroupsPrimary()
  ])
  return {
    tests,
    subgroups,
    groups
  }
}

export default function TestsHierarchyRoute({
  loaderData: {
    tests: initialTests,
    subgroups: initialSubgroups,
    groups: initialGroups
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [tests, setTests] = React.useState<TestSecondary[] | null>(initialTests)
  const [subgroups, setSubgroups] = React.useState<SubgroupSecondary[] | null>(
    initialSubgroups
  )
  const [groups, setGroups] = React.useState<GroupPrimary[] | null>(
    initialGroups
  )

  useTestsSubscription('UP_TO_SECONDARY_PROPS', setTests)
  useSubgroupsSubscription('UP_TO_SECONDARY_PROPS', setSubgroups)
  useGroupsSubscription('PRIMARY_PROPS', setGroups)

  React.useEffect(() => {
    if (
      tests === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TEST')
    ) {
      notifier.showError('не удалось загрузить список тестов')
    }
  }, [tests, notifier])

  React.useEffect(() => {
    if (
      subgroups === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_SUBGROUP')
    ) {
      notifier.showError('не удалось загрузить список подгрупп')
    }
  }, [subgroups, notifier])

  React.useEffect(() => {
    if (
      groups === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_GROUP')
    ) {
      notifier.showError('не удалось загрузить список групп')
    }
  }, [groups, notifier])

  return meta.status === 'AUTHENTICATED' &&
    (meta.selfMeta.rights.includes('READ_TEST') === false ||
      meta.selfMeta.rights.includes('READ_SUBGROUP') === false ||
      meta.selfMeta.rights.includes('READ_GROUP') === false) ? (
    <ForbiddenScreen />
  ) : tests !== null && subgroups !== null && groups !== null ? (
    <TestsHierarchyScreen tests={tests} subgroups={subgroups} groups={groups}>
      {outlet !== null ? outlet : null}
    </TestsHierarchyScreen>
  ) : null
}
