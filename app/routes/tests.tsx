// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TestsScreen } from '~/components/screens/tests'
// React router
import type { Route } from './+types/tests'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [topologies, dbcs, testTemplates, tests, subgroups] =
    await (async () => {
      if (serverConnector.meta.status !== 'AUTHENTICATED') {
        return [null, null, null, null, null]
      } else {
        const rights = serverConnector.meta.selfMeta.rights
        return await Promise.all([
          rights.includes('READ_TOPOLOGY')
            ? serverConnector
                .readTopologies({
                  scope: 'PRIMARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_DBC')
            ? serverConnector
                .readDbcs({
                  scope: 'PRIMARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_TEST_TEMPLATE')
            ? serverConnector
                .readTestTemplates({
                  scope: 'PRIMARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_TEST')
            ? serverConnector
                .readTests({
                  scope: 'UP_TO_SECONDARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_SUBGROUP')
            ? serverConnector
                .readSubgroups({
                  scope: 'PRIMARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null)
        ])
      }
    })()
  return {
    topologies,
    dbcs,
    testTemplates,
    tests,
    subgroups
  }
}

export default function MetaRoute({
  loaderData: { topologies, dbcs, testTemplates, tests, subgroups }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (
      tests === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TEST')
    ) {
      notifier.showError('не удалось загрузить список тестов')
    }
  }, [tests, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST') === false ? (
    <ForbiddenScreen />
  ) : (
    <TestsScreen
      initialTopologies={topologies}
      initialDbcs={dbcs}
      initialTestTemplates={testTemplates}
      initialTests={tests ?? []}
      initialSubgroups={subgroups}
    />
  )
}
