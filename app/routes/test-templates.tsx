// Project
import type { TestTemplateSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readTestTemplatesSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useTestTemplatesSubscription } from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TestTemplatesScreen } from '~/components/screens/test-templates'
// React router
import type { Route } from './+types/test-templates'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [testTemplates] = await Promise.all([readTestTemplatesSecondary()])
  return {
    testTemplates
  }
}

export default function TestTemplatesRoute({
  loaderData: { testTemplates: initialTestTemplates }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [testTemplates, setTestTemplates] = React.useState<
    TestTemplateSecondary[] | null
  >(initialTestTemplates)

  useTestTemplatesSubscription('UP_TO_SECONDARY_PROPS', setTestTemplates)

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
  ) : testTemplates !== null ? (
    <TestTemplatesScreen testTemplates={testTemplates} />
  ) : null
}
