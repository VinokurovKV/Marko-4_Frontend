// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TestTemplatesScreen } from '~/components/screens/test-templates'
// React router
import type { Route } from './+types/test-templates'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [testTemplates] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_TEST_TEMPLATE')
          ? serverConnector
              .readTestTemplates({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    testTemplates
  }
}

export default function MetaRoute({
  loaderData: { testTemplates }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (
      testTemplates === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TEST_TEMPLATE')
    ) {
      notifier.showError('не удалось загрузить список шаблонов тестов')
    }
  }, [testTemplates, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_TEMPLATE') === false ? (
    <ForbiddenScreen />
  ) : (
    <TestTemplatesScreen initialTestTemplates={testTemplates ?? []} />
  )
}
