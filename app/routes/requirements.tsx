// Project
import type {
  RequirementSecondary,
  RequirementsHierarchy,
  TestPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readRequirementsSecondary,
  readRequirementsHierarchy,
  readTestsPrimary
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useRequirementsSubscription,
  useRequirementsHierarchySubscription,
  useTestsSubscription
} from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { RequirementsScreen } from '~/components/screens/requirements'
// React router
import type { Route } from './+types/requirements'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [requirements, requirementsHierarchy, tests] = await Promise.all([
    readRequirementsSecondary(),
    readRequirementsHierarchy(),
    readTestsPrimary()
  ])
  return {
    requirements,
    requirementsHierarchy,
    tests
  }
}

export default function RequirementsRoute({
  loaderData: {
    requirements: initialRequirements,
    requirementsHierarchy: initialRequirementsHierarchy,
    tests: initialTests
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [requirements, setRequirements] = React.useState<
    RequirementSecondary[] | null
  >(initialRequirements)
  const [requirementsHierarchy, setRequirementsHierarchy] =
    React.useState<RequirementsHierarchy | null>(initialRequirementsHierarchy)
  const [tests, setTests] = React.useState<TestPrimary[] | null>(initialTests)

  useRequirementsSubscription('UP_TO_SECONDARY_PROPS', setRequirements)
  useRequirementsHierarchySubscription(setRequirementsHierarchy)
  useTestsSubscription('PRIMARY_PROPS', setTests)

  React.useEffect(() => {
    if (
      requirements === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_REQUIREMENT')
    ) {
      notifier.showError('не удалось загрузить список требований')
    }
  }, [requirements, notifier])

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
  ) : requirements !== null && requirementsHierarchy !== null ? (
    <RequirementsScreen
      requirements={requirements}
      requirementsHierarchy={requirementsHierarchy}
      tests={tests}
    >
      {outlet !== null ? outlet : null}
    </RequirementsScreen>
  ) : null
}
