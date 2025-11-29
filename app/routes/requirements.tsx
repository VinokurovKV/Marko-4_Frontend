// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { RequirementsScreen } from '~/components/screens/requirements'
// React router
import type { Route } from './+types/requirements'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [requirements] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_REQUIREMENT')
          ? serverConnector
              .readRequirements({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    requirements
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
  }, [requirements])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT') === false ? (
    <ForbiddenScreen />
  ) : (
    <RequirementsScreen initialRequirements={requirements ?? []} />
  )
}
