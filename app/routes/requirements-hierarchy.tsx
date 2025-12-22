// Project
import type { RequirementsHierarchy, TestPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readRequirementsHierarchy, readTestsPrimary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useRequirementsHierarchySubscription,
  useTestsSubscription
} from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { RequirementsHierarchyScreen } from '~/components/screens/requirements-hierarchy'
// React router
import type { Route } from './+types/requirements'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [requirementsHierarchy, tests] = await Promise.all([
    readRequirementsHierarchy(),
    readTestsPrimary()
  ])
  return {
    requirementsHierarchy,
    tests
  }
}

export default function RequirementsRoute({
  loaderData: {
    requirementsHierarchy: initialRequirementsHierarchy,
    tests: initialTests
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [requirementsHierarchy, setRequirementsHierarchy] =
    React.useState<RequirementsHierarchy | null>(initialRequirementsHierarchy)
  const [tests, setTests] = React.useState<TestPrimary[] | null>(initialTests)

  useRequirementsHierarchySubscription(setRequirementsHierarchy)
  useTestsSubscription('PRIMARY_PROPS', setTests)

  React.useEffect(() => {
    if (
      requirementsHierarchy === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_REQUIREMENT')
    ) {
      notifier.showError('не удалось загрузить иерархию требований')
    }
  }, [requirementsHierarchy, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT') === false ? (
    <ForbiddenScreen />
  ) : requirementsHierarchy !== null ? (
    <RequirementsHierarchyScreen
      requirementsHierarchy={requirementsHierarchy}
      tests={tests}
    >
      {outlet !== null ? outlet : null}
    </RequirementsHierarchyScreen>
  ) : null
}
