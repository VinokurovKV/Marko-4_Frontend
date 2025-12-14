// Project
import type { RequirementSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readRequirementsSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useRequirementsSubscription } from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { RequirementsScreen } from '~/components/screens/requirements'
// React router
import type { Route } from './+types/requirements'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [requirements] = await Promise.all([readRequirementsSecondary()])
  return {
    requirements
  }
}

export default function RequirementsRoute({
  loaderData: { requirements: initialRequirements }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [requirements, setRequirements] = React.useState<
    RequirementSecondary[] | null
  >(initialRequirements)

  useRequirementsSubscription('UP_TO_SECONDARY_PROPS', setRequirements)

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
    <RequirementsScreen requirements={requirements}>
      {outlet !== null ? outlet : null}
    </RequirementsScreen>
  ) : null
}
