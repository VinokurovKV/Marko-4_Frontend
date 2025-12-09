// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TestReportScreen } from '~/components/screens/test-report'
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
  const [test, testReports] = await (async () => {
    if (
      taskId === null ||
      testId === null ||
      serverConnector.meta.status !== 'AUTHENTICATED'
    ) {
      return [null, null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_TEST')
          ? serverConnector
              .readTest(
                {
                  id: testId
                },
                {
                  scope: 'PRIMARY_PROPS'
                }
              )
              .catch(() => null)
          : Promise.resolve(null),
        rights.includes('READ_TEST_REPORT')
          ? serverConnector
              .readTestReports({
                taskIds: [taskId],
                testIds: [testId],
                scope: 'PRIMARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  const testReportId =
    testReports !== null && testReports.length === 1 ? testReports[0].id : null
  const [testReport] = await (async () => {
    if (
      serverConnector.meta.status !== 'AUTHENTICATED' ||
      testReportId === null
    ) {
      return [null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_TEST_REPORT')
          ? serverConnector
              .readTestReport(
                { id: testReportId },
                {
                  scope: 'UP_TO_TERTIARY_PROPS'
                }
              )
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return { taskId, testId, test, testReport }
}

export default function MetaRoute({
  loaderData: { taskId, testId, test, testReport }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (taskId === null) {
      notifier.showError(
        'указан некорректный идентификатор задания при загрузке отчета о выполнении теста'
      )
    } else if (testId === null) {
      notifier.showError(
        'указан некорректный идентификатор теста при загрузке отчета о выполнении теста'
      )
    } else if (
      testReport === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TEST_REPORT')
    ) {
      notifier.showError(
        `не удалось загрузить отчет о выполнении теста для задания с идентификатором ${taskId} и теста с идентификатором ${testId}`
      )
    }
  }, [taskId, testId, testReport])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') === false ? (
    <ForbiddenScreen />
  ) : taskId !== null && testId !== null && testReport !== null ? (
    <TestReportScreen
      key={`${taskId}-${testId}`}
      testReportId={testReport.id}
      testId={testId}
      // testTransitionNum={-1}
      initialTest={test}
      initialTestReport={testReport}
    />
  ) : null
}
