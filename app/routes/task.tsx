// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TaskScreen } from '~/components/screens/task'
// React router
import type { Route } from './+types/task'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const taskId = (() => {
    const parsed = parseInt(params.taskId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [task, testReports] = await (async () => {
    if (taskId === null || serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null, null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
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
          : Promise.resolve(null)
      ])
    }
  })()
  const testIds = (testReports ?? []).map((testReport) => testReport.testId)
  const [commonTopology, tests] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED' || task === null) {
      return [null, null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
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
        rights.includes('READ_TEST')
          ? serverConnector
              .readTests({
                ids: [testIds],
                scope: 'PRIMARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    taskId,
    commonTopology,
    tests,
    task,
    testReports
  }
}

export default function MetaRoute({
  loaderData: { taskId, commonTopology, tests, task, testReports }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (taskId === null) {
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
    }
  }, [taskId, task, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK') === false ? (
    <ForbiddenScreen />
  ) : taskId !== null && task !== null ? (
    <TaskScreen
      taskId={taskId}
      initialCommonTopology={commonTopology}
      initialTests={tests}
      initialTask={task}
      initialTestReports={testReports}
    />
  ) : null
}
