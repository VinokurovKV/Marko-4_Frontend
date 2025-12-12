// Project
import { serverConnector } from '~/server-connector'
import type {
  TagPrimary,
  CommonTopologyPrimary,
  TestPrimary,
  TaskTertiary,
  TestReportSecondary,
  TaskReportTertiary
} from '~/types'
import {
  readTaskTertiary,
  readTestReportsSecondaryForTask,
  readTaskReportSecondaryForTask,
  readTagsPrimaryFiltered,
  readCommonTopologyPrimary,
  readCommonTopologyVersion,
  readTestsPrimaryFiltered
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useCommonTopologySubscription,
  useTestsFilteredSubscription,
  useTaskSubscription,
  useTestReportsSubscription,
  useTaskReportSubscription
} from '~/hooks/resources'
import { TaskViewer } from '~/components/single-resource-viewers/resources/task'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/task'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const taskId = (() => {
    const parsed = parseInt(params.taskId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [task, testReports, taskReport] = await Promise.all([
    readTaskTertiary(taskId),
    readTestReportsSecondaryForTask(taskId),
    readTaskReportSecondaryForTask(taskId)
  ])
  const tagIds = task?.tagIds ?? null
  const testIds = testReports?.map((testReport) => testReport.testId) ?? null
  const [tags, commonTopology, commonTopologyVersion, tests] =
    await Promise.all([
      readTagsPrimaryFiltered(tagIds),
      readCommonTopologyPrimary(task?.commonTopology.id ?? null),
      readCommonTopologyVersion(task?.commonTopology ?? null),
      readTestsPrimaryFiltered(testIds)
    ])
  return {
    taskId,
    taskReportId: taskReport?.id ?? null,
    tags,
    commonTopology,
    commonTopologyVersion,
    tests,
    task,
    testReports,
    taskReport
  }
}

function TaskRouteInner({
  loaderData: {
    taskId,
    taskReportId,
    tags: initialTags,
    commonTopology: initialCommonTopology,
    commonTopologyVersion,
    tests: initialTests,
    task: initialTask,
    testReports: initialTestReports,
    taskReport: initialTaskReport
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [tags, setTags] = React.useState<TagPrimary[] | null>(initialTags)
  const [commonTopology, setCommonTopology] =
    React.useState<CommonTopologyPrimary | null>(initialCommonTopology)
  const [tests, setTests] = React.useState<TestPrimary[] | null>(initialTests)
  const [task, setTask] = React.useState<TaskTertiary | null>(initialTask)
  const [testReports, setTestReports] = React.useState<
    TestReportSecondary[] | null
  >(initialTestReports)
  const [taskReport, setTaskReport] = React.useState<TaskReportTertiary | null>(
    initialTaskReport
  )

  const tagIds = React.useMemo(() => task?.tagIds ?? null, [task])

  const testIds = React.useMemo(
    () => testReports?.map((testReport) => testReport.testId) ?? null,
    [testReports]
  )

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useCommonTopologySubscription(
    'PRIMARY_PROPS',
    task?.commonTopology.id ?? null,
    setCommonTopology
  )
  useTestsFilteredSubscription('PRIMARY_PROPS', testIds, setTests)
  useTaskSubscription('UP_TO_TERTIARY_PROPS', taskId, setTask)
  useTestReportsSubscription('UP_TO_SECONDARY_PROPS', taskId, setTestReports)
  useTaskReportSubscription('UP_TO_TERTIARY_PROPS', taskReportId, setTaskReport)

  React.useEffect(() => {
    if (taskId === null) {
      notifier.showError(
        'указан некорректный идентификатор задания тестирования в URL'
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
  }, [taskId, task, taskReport, notifier])

  return meta.status === 'AUTHENTICATED' &&
    (meta.selfMeta.rights.includes('READ_TASK') === false ||
      meta.selfMeta.rights.includes('READ_TASK_REPORT') === false) ? (
    <ForbiddenScreen />
  ) : taskId !== null &&
    taskReportId !== null &&
    task !== null &&
    taskReport !== null ? (
    <TaskViewer
      key={taskId}
      tags={tags}
      commonTopology={commonTopology}
      commonTopologyVersion={commonTopologyVersion}
      tests={tests}
      task={task}
      testReports={testReports}
      taskReport={taskReport}
    >
      {outlet !== null ? outlet : null}
    </TaskViewer>
  ) : null
}

export default function TestRoute(props: Route.ComponentProps) {
  return <TaskRouteInner key={props.loaderData.taskId} {...props} />
}
