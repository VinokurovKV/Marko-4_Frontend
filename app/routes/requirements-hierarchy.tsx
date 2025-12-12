// Project
import { serverConnector } from '~/server-connector'
import { readRequirementsPrimary, readRequirementTertiary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { RequirementsHierarchyScreen } from '~/components/screens/requirements-hierarchy'
// React router
import type { Route } from './+types/requirements-hierarchy'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [requirementsPrimary] = await Promise.all([readRequirementsPrimary()])
  const requirementIds =
    requirementsPrimary?.map((requirement) => requirement.id) ?? null
  const [requirements] = await Promise.all([
    requirementIds !== null
      ? Promise.all(
          requirementIds.map((requirementId) =>
            readRequirementTertiary(requirementId)
          )
        )
      : Promise.resolve(null)
  ])
  return {
    requirements:
      requirements !== null &&
      requirements.every((requirement) => requirement !== null)
        ? requirements
        : null
  }
}

export default function RequirementsHierarchyRoute({
  loaderData: { requirements }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

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
    <RequirementsHierarchyScreen />
  ) : // <RequirementsHierarchyScreen initialRequirements={requirements} />
  null
}
