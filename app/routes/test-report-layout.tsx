// Project
import type { ReadTestWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TestReportLayoutScreen } from '~/components/screens/test-report-layout'
// React router
import type { Route } from './+types/test-report-layout'
import { Outlet } from 'react-router'
// React
import * as React from 'react'

type Test = DtoWithoutEnums<ReadTestWithPrimaryPropsSuccessResultDto>

const EMPTY_TESTS_ARR: Test[] = []

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
  const [commonTopologies, tasks, task, testReports, taskReports] =
    await (async () => {
      if (taskId === null || serverConnector.meta.status !== 'AUTHENTICATED') {
        return [null, null, null, null, null]
      } else {
        const rights = serverConnector.meta.selfMeta.rights
        return await Promise.all([
          rights.includes('READ_COMMON_TOPOLOGY')
            ? serverConnector
                .readCommonTopologies({
                  scope: 'PRIMARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_TASK')
            ? serverConnector
                .readTasks({
                  scope: 'UP_TO_SECONDARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_TASK')
            ? serverConnector
                .readTask(
                  {
                    id: taskId
                  },
                  {
                    scope: 'UP_TO_TERTIARY_PROPS'
                  }
                )
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_TEST_REPORT')
            ? serverConnector
                .readTestReports({
                  taskIds: [taskId],
                  scope: 'UP_TO_SECONDARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_TASK_REPORT')
            ? serverConnector
                .readTaskReports({
                  taskIds: [taskId],
                  scope: 'UP_TO_SECONDARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null)
        ])
      }
    })()
  const tagIds = task?.tagIds ?? []
  const testIds = (testReports ?? []).map((testReport) => testReport.testId)
  const [tags, commonTopology, commonTopologyVersion, tests] =
    await (async () => {
      if (serverConnector.meta.status !== 'AUTHENTICATED' || task === null) {
        return [null, null, null, null]
      } else {
        const rights = serverConnector.meta.selfMeta.rights
        return await Promise.all([
          rights.includes('READ_TAG')
            ? serverConnector
                .readTags({
                  ids: tagIds,
                  scope: 'PRIMARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_COMMON_TOPOLOGY')
            ? serverConnector
                .readCommonTopology(
                  { id: task.commonTopology.id },
                  {
                    scope: 'PRIMARY_PROPS'
                  }
                )
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_COMMON_TOPOLOGY')
            ? serverConnector
                .readCommonTopologyVersion(task.commonTopology)
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_TEST')
            ? serverConnector
                .readTests({
                  ids: testIds,
                  scope: 'PRIMARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null)
        ])
      }
    })()
  return {
    commonTopologies,
    tasks,
    taskId,
    tags,
    commonTopology,
    commonTopologyVersion,
    testId,
    tests,
    task,
    testReports,
    taskReport:
      taskReports !== null && taskReports.length === 1 ? taskReports[0] : null
  }
}

export default function MetaRoute({
  loaderData: {
    commonTopologies,
    tasks,
    taskId,
    tags,
    commonTopology,
    commonTopologyVersion,
    testId,
    tests,
    task,
    testReports,
    taskReport
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (
      tasks === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TASK')
    ) {
      notifier.showError('не удалось загрузить список заданий тестирования')
    } else if (taskId === null) {
      notifier.showError(
        'указан некорректный идентификатор при загрузке задания тестирования'
      )
    } else if (
      task === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TASK')
    ) {
      notifier.showError(
        `не удалось загрузить задание тестирования с идентификатором ${taskId}`
      )
    } else if (
      taskReport === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TASK_REPORT')
    ) {
      notifier.showError(
        `не удалось загрузить отчет о выполнении задания тестирования с идентификатором ${taskId}`
      )
    }
  }, [tasks, notifier])

  const testReportId = React.useMemo(
    () =>
      (testReports ?? []).find((testReport) => testReport.testId === testId)
        ?.id ?? null,
    [testId, testReports]
  )

  return meta.status === 'AUTHENTICATED' &&
    (meta.selfMeta.rights.includes('READ_TASK') === false ||
      meta.selfMeta.rights.includes('READ_TASK_REPORT') === false ||
      meta.selfMeta.rights.includes('READ_TEST_REPORT') === false) ? (
    <ForbiddenScreen />
  ) : task !== null && testReportId !== null && taskReport !== null ? (
    <TestReportLayoutScreen
      tags={tags}
      initialCommonTopologies={commonTopologies}
      commonTopology={commonTopology}
      commonTopologyVersion={commonTopologyVersion}
      tests={tests ?? EMPTY_TESTS_ARR}
      initialTasks={tasks ?? []}
      task={task}
      testReports={testReports}
      testReportId={testReportId}
      taskReport={taskReport}
    >
      {<Outlet />}
    </TestReportLayoutScreen>
  ) : null
}
