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
  readCommonTopologiesPrimary,
  readTestsPrimaryFiltered
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useCommonTopologiesSubscription,
  useCommonTopologySubscription,
  useTestsFilteredSubscription,
  useTaskSubscription,
  useTestReportsSubscription,
  useTaskReportSubscription
} from '~/hooks/resources'
import { TaskViewer } from '~/components/single-viewers/resources/task'
import { CreateTaskFormDialog } from '~/components/forms/resources/create-task'
import { ProjButton } from '~/components/buttons/button'
import {
  type CreateTaskFormData,
  getDeviceIdField
} from '~/data/forms/resources/create-task'
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
  const [task, testReports, taskReport, commonTopologies] = await Promise.all([
    readTaskTertiary(taskId),
    readTestReportsSecondaryForTask(taskId),
    readTaskReportSecondaryForTask(taskId),
    readCommonTopologiesPrimary()
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
    commonTopologies,
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
    commonTopologies: initialCommonTopologies,
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
  const [commonTopologies, setCommonTopologies] = React.useState<
    CommonTopologyPrimary[] | null
  >(initialCommonTopologies)
  const [task, setTask] = React.useState<TaskTertiary | null>(initialTask)
  const [testReports, setTestReports] = React.useState<
    TestReportSecondary[] | null
  >(initialTestReports)
  const [taskReport, setTaskReport] = React.useState<TaskReportTertiary | null>(
    initialTaskReport
  )
  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const tagIds = React.useMemo(() => task?.tagIds ?? null, [task])

  const testIds = React.useMemo(
    () => testReports?.map((testReport) => testReport.testId) ?? null,
    [testReports]
  )

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useCommonTopologiesSubscription('PRIMARY_PROPS', setCommonTopologies)
  useCommonTopologySubscription(
    'PRIMARY_PROPS',
    task?.commonTopology.id ?? null,
    setCommonTopology
  )
  useTestsFilteredSubscription('PRIMARY_PROPS', testIds, null, setTests)
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

  const createTaskInitialFormData =
    React.useMemo<CreateTaskFormData | null>(() => {
      if (task === null) {
        return null
      }
      const testIds = new Set<number>()
      const subgroupIds = new Set<number>()
      const groupIds = new Set<number>()

      for (const orphanTest of task.hierarchy.orphanTests) {
        testIds.add(orphanTest.id)
      }
      for (const orphanSubgroup of task.hierarchy.orphanSubgroups) {
        subgroupIds.add(orphanSubgroup.version.id)
        for (const test of orphanSubgroup.tests) {
          testIds.add(test.id)
        }
      }
      for (const group of task.hierarchy.groups) {
        groupIds.add(group.version.id)
        for (const subgroup of group.subgroups) {
          subgroupIds.add(subgroup.version.id)
          for (const test of subgroup.tests) {
            testIds.add(test.id)
          }
        }
      }

      const initialData: CreateTaskFormData = {
        name:
          task.name !== null && task.name.trim() !== ''
            ? `Шаблон по ${task.name}`
            : `Шаблон по ${task.code}`,
        mode: task.mode,
        commonTopologyId: task.commonTopology.id,
        testIds: Array.from(testIds),
        subgroupIds: Array.from(subgroupIds),
        groupIds: Array.from(groupIds),
        resultsToSave: task.resultsToSave,
        abortIfNotPassed: task.abortIfNotPassed,
        withoutDeviceConfig: task.withoutDeviceConfig,
        priority: task.priority,
        paused: task.paused,
        minLaunchTime: task.minLaunchTime ?? undefined,
        descriptionText: task.description?.text,
        tagIds: task.tagIds,
        remarkText: task.remark?.text
      }
      const vertexesSorted = [...task.vertexes].toSorted((a, b) =>
        a.vertexName.localeCompare(b.vertexName)
      )
      for (const [vertexIndex, vertex] of vertexesSorted.entries()) {
        initialData[getDeviceIdField(vertexIndex)] = vertex.device.id
      }
      return initialData
    }, [task])

  const titleRight = React.useMemo(
    () =>
      meta.status === 'AUTHENTICATED' &&
      meta.selfMeta.rightsSet.has('CREATE_TASK') &&
      createTaskInitialFormData !== null ? (
        <ProjButton
          variant="contained"
          onClick={() => {
            setCreateModeIsActive(true)
          }}
        >
          создать шаблон
        </ProjButton>
      ) : null,
    [meta, createTaskInitialFormData]
  )

  return meta.status === 'AUTHENTICATED' &&
    (meta.selfMeta.rights.includes('READ_TASK') === false ||
      meta.selfMeta.rights.includes('READ_TASK_REPORT') === false) ? (
    <ForbiddenScreen />
  ) : taskId !== null &&
    taskReportId !== null &&
    task !== null &&
    taskReport !== null ? (
    <>
      <TaskViewer
        key={taskId}
        tags={tags}
        commonTopology={commonTopology}
        commonTopologyVersion={commonTopologyVersion}
        tests={tests}
        task={task}
        testReports={testReports}
        taskReport={taskReport}
        titleRight={titleRight}
      >
        {outlet !== null ? outlet : null}
      </TaskViewer>
      <CreateTaskFormDialog
        commonTopologies={commonTopologies}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        initialFormData={createTaskInitialFormData ?? undefined}
        clearTrigger={task.id}
        onSuccessCreateTask={() => {
          setCreateModeIsActive(false)
        }}
        onCancelClick={() => {
          setCreateModeIsActive(false)
        }}
      />
    </>
  ) : null
}

export default function TestRoute(props: Route.ComponentProps) {
  return <TaskRouteInner key={props.loaderData.taskId} {...props} />
}
