// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { CoveragesScreen } from '~/components/screens/coverages'
// React router
import type { Route } from './+types/coverages'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [requirements, coverages] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null, null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_REQUIREMENT')
          ? serverConnector
              .readRequirements({
                scope: 'PRIMARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null),
        rights.includes('READ_COVERAGE')
          ? serverConnector
              .readCoverages({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    requirements,
    coverages
  }
}

export default function MetaRoute({
  loaderData: { requirements, coverages }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (
      coverages === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_COVERAGE')
    ) {
      notifier.showError('не удалось загрузить список покрытий требований')
    }
  }, [coverages, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COVERAGE') === false ? (
    <ForbiddenScreen />
  ) : (
    <CoveragesScreen
      initialRequirements={requirements}
      initialCoverages={coverages ?? []}
    />
  )
}
