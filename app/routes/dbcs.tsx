// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { DbcsScreen } from '~/components/screens/dbcs'
// React router
import type { Route } from './+types/dbcs'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [dbcs] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_DBC')
          ? serverConnector
              .readDbcs({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    dbcs
  }
}

export default function MetaRoute({
  loaderData: { dbcs }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (
      dbcs === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_DBC')
    ) {
      notifier.showError('не удалось загрузить список базовых конфигураций')
    }
  }, [dbcs, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DBC') === false ? (
    <ForbiddenScreen />
  ) : (
    <DbcsScreen initialDbcs={dbcs ?? []} />
  )
}
