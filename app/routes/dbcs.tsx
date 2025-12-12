// Project
import type { DbcSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readDbcsSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useDbcsSubscription } from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { DbcsScreen } from '~/components/screens/dbcs'
// React router
import type { Route } from './+types/dbcs'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [dbcs] = await Promise.all([readDbcsSecondary()])
  return {
    dbcs
  }
}

export default function DbcsRoute({
  loaderData: { dbcs: initialDbcs }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [dbcs, setDbcs] = React.useState<DbcSecondary[] | null>(initialDbcs)

  useDbcsSubscription('UP_TO_SECONDARY_PROPS', setDbcs)

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
  ) : dbcs !== null ? (
    <DbcsScreen dbcs={dbcs} />
  ) : null
}
