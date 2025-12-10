// Project
import { serverConnector } from '~/server-connector'
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
  const [requirementsPrimary] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_REQUIREMENT')
          ? serverConnector
              .readRequirements({
                scope: 'PRIMARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  const requirementIds =
    requirementsPrimary?.map((requirement) => requirement.id) ?? null
  const requirements = await (async () => {
    if (
      serverConnector.meta.status !== 'AUTHENTICATED' ||
      serverConnector.meta.selfMeta.rights.includes('READ_REQUIREMENT') ===
        false ||
      requirementIds === null
    ) {
      return null
    } else {
      return await Promise.all(
        requirementIds.map((requirementId) =>
          serverConnector
            .readRequirement(
              { id: requirementId },
              {
                scope: 'UP_TO_TERTIARY_PROPS'
              }
            )
            .catch(() => null)
        )
      )
    }
  })()
  return {
    requirements:
      requirements !== null &&
      requirements.every((requirement) => requirement !== null)
        ? requirements
        : null
  }
}

export default function MetaRoute({
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
    <RequirementsHierarchyScreen initialRequirements={requirements} />
  ) : null
}
