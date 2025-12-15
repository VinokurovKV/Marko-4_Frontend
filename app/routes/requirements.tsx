// Project
import type { RequirementSecondary, TestPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readRequirementsSecondary, readTestsPrimary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useRequirementsSubscription,
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
  const [requirements, tests] = await Promise.all([
    readRequirementsSecondary(),
    readTestsPrimary()
  ])
  return {
    requirements,
    tests
  }
}

export default function RequirementsRoute({
  loaderData: { requirements: initialRequirements, tests: initialTests }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [requirements, setRequirements] = React.useState<
    RequirementSecondary[] | null
  >(initialRequirements)
  const [tests, setTests] = React.useState<TestPrimary[] | null>(initialTests)

  useRequirementsSubscription('UP_TO_SECONDARY_PROPS', setRequirements)
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

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT') === false ? (
    <ForbiddenScreen />
  ) : requirements !== null ? (
    <RequirementsScreen requirements={requirements} tests={tests}>
      {outlet !== null ? outlet : null}
    </RequirementsScreen>
  ) : null
}
