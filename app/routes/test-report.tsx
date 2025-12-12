// Project
import type { TestPrimary, TestReportTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTestPrimary,
  readTestReportTertiaryForTaskAndTest
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTestSubscription,
  useTestReportSubscription
} from '~/hooks/resources'
import { TestReportViewer } from '~/components/single-resource-viewers/resources/test-report'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/test-report'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const taskId = (() => {
    const parsed = parseInt(params.taskId)
    return isNaN(parsed) ? null : parsed
  })()
  const testId = (() => {
    const parsed = parseInt(params.testId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [test, testReport] = await Promise.all([
    readTestPrimary(testId),
    readTestReportTertiaryForTaskAndTest(taskId, testId)
  ])
  return { taskId, testId, test, testReport }
}

function TestReportRouteInner({
  loaderData: {
    taskId,
    testId,
    test: initialTest,
    testReport: initialTestReport
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [test, setTest] = React.useState<TestPrimary | null>(initialTest)
  const [testReport, setTestReport] = React.useState<TestReportTertiary | null>(
    initialTestReport
  )

  useTestSubscription('PRIMARY_PROPS', testId, setTest)
  useTestReportSubscription(
    'UP_TO_TERTIARY_PROPS',
    testReport?.id ?? null,
    setTestReport
  )

  React.useEffect(() => {
    if (taskId === null) {
      notifier.showError(
        'указан некорректный идентификатор задания тестирования в URL'
      )
    } else if (testId === null) {
      notifier.showError('указан некорректный идентификатор теста в URL')
    } else if (
      testReport === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TEST_REPORT')
    ) {
      notifier.showError(
        `не удалось загрузить отчет о выполнении теста для задания тестирования с идентификатором ${taskId} и теста с идентификатором ${testId}`
      )
    }
  }, [taskId, testId, testReport])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') === false ? (
    <ForbiddenScreen />
  ) : taskId !== null && testId !== null && testReport !== null ? (
    <TestReportViewer
      key={`${taskId}-${testId}`}
      // testTransitionNum={-1}
      test={test}
      testReport={testReport}
    />
  ) : null
}

export default function TestReportRoute(props: Route.ComponentProps) {
  return (
    <TestReportRouteInner
      key={`${props.loaderData.taskId}-${props.loaderData.testId}`}
      {...props}
    />
  )
}
