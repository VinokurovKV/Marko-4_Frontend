// Project
import type {
  TagPrimary,
  CommonTopologyPrimary,
  CommonTopologyVersion,
  TestPrimary,
  DevicePrimary,
  TaskTertiary,
  TestReportSecondary,
  TaskReportTertiary
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useMeta } from '~/providers/meta'
import { useDialogs } from '~/providers/dialogs'
import { useNotifier } from '~/providers/notifier'
import {
  localizationForTaskMode,
  localizationForTaskResultToSave,
  localizationForTaskStatus
} from '@common/localization'
import {
  FlagIcon,
  TaskModeIcon,
  TaskStatusIcon,
  TestStatusIcon
} from '~/components/icons'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import { TestReportsGrid } from '~/components/grids/resources/test-reports'
import { UpdateTaskFormDialog } from '~/components/forms/resources/update-task'
import {
  ColumnViewer,
  ColumnViewerActions,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerIconsBlock,
  type ColumnViewerIconsBlockProps,
  ColumnViewerItem,
  ColumnViewerRef,
  ColumnViewerText,
  ColumnViewerTime
} from '../common'
// React router
import { matchPath, useLocation, useNavigate } from 'react-router'
// React
import * as React from 'react'
// Other
import capitalize from 'capitalize'

const EMPTY_TESTS_ARR: TestPrimary[] = []
const EMPTY_TEST_REPORTS_ARR: TestReportSecondary[] = []

export interface TaskViewerProps {
  tags: TagPrimary[] | null
  commonTopology: CommonTopologyPrimary | null
  commonTopologyVersion: CommonTopologyVersion | null
  tests: TestPrimary[] | null
  devices: DevicePrimary[] | null
  task: TaskTertiary
  testReports: TestReportSecondary[] | null
  taskReport: TaskReportTertiary
  titleRight?: React.ReactNode
  children: React.ReactNode
}

export function TaskViewer(props: TaskViewerProps) {
  const navigate = useNavigate()
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )
  const dialogs = useDialogs()
  const task = props.task
  const taskReport = props.taskReport

  const { pathname } = useLocation()
  const match = matchPath('/tasks/:taskId?/:testId?', pathname)
  const withTest = match?.params.testId !== undefined
  const testId = React.useMemo(() => {
    const parsed =
      match?.params.testId !== undefined ? parseInt(match.params.testId) : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])
  const testReportId = React.useMemo(
    () =>
      props.testReports?.find((testReport) => testReport.testId === testId)
        ?.id ?? null,
    [props.testReports, testId]
  )

  const deviceCodeForId = React.useMemo(
    () =>
      new Map((props.devices ?? []).map((device) => [device.id, device.code])),
    [props.devices]
  )

  // Edit form states
  const [updatedTaskId, setUpdatedTaskId] = React.useState<number | null>(null)

  const testsCountsItems = React.useMemo(() => {
    const items: ColumnViewerIconsBlockProps['items'] = []
    if (taskReport.waitingCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="WAITING" />,
        text: taskReport.waitingCount
      })
    }
    if (taskReport.canceledCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="CANCELED" />,
        text: taskReport.canceledCount
      })
    }
    if (taskReport.launchedCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="LAUNCHED" />,
        text: taskReport.launchedCount
      })
    }
    if (taskReport.abortedCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="ABORTED" />,
        text: taskReport.abortedCount
      })
    }
    if (taskReport.errorCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="ERROR" />,
        text: taskReport.errorCount
      })
    }
    if (taskReport.failedCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="FAILED" />,
        text: taskReport.failedCount
      })
    }
    if (taskReport.passedCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="PASSED" />,
        text: taskReport.passedCount
      })
    }
    return items
  }, [taskReport])

  const handleUpdateClick = React.useCallback(() => {
    setUpdatedTaskId(task.id)
    return Promise.resolve()
  }, [task])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedTaskId(null)
  }, [setUpdatedTaskId])

  const handleCancelClick = React.useCallback(async () => {
    try {
      await serverConnector.cancelTask({
        id: task.id
      })
      notifier.showSuccess(`задание тестирования «${task.code}» отменено`)
    } catch (error) {
      notifier.showError(error)
    }
  }, [navigate, dialogs, task])

  const handleAbortClick = React.useCallback(async () => {
    try {
      await serverConnector.abortTask({
        id: task.id
      })
      notifier.showSuccess(`задание тестирования «${task.code}» прервано`)
    } catch (error) {
      notifier.showError(error)
    }
  }, [navigate, dialogs, task])

  const handlePauseClick = React.useCallback(async () => {
    try {
      await serverConnector.pauseTask({
        id: task.id
      })
      notifier.showSuccess(`задание тестирования «${task.code}» приостановлено`)
    } catch (error) {
      notifier.showError(error)
    }
  }, [navigate, dialogs, task])

  const handleUnpauseClick = React.useCallback(async () => {
    try {
      await serverConnector.unpauseTask({
        id: task.id
      })
      notifier.showSuccess(`задание тестирования «${task.code}» возобновлено`)
    } catch (error) {
      notifier.showError(error)
    }
  }, [navigate, dialogs, task])

  const handleDeleteClick = React.useCallback(async () => {
    const confirmText = `удалить задание '${task.code}'?`
    const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
      severity: 'error',
      okText: 'Удалить',
      cancelText: 'Отменить'
    })
    if (confirmed) {
      try {
        await serverConnector.deleteTask({
          id: task.id
        })
        notifier.showSuccess(`задание «${task.code}» удалено`)
        void navigate('/tasks')
      } catch (error) {
        notifier.showError(error)
      }
    }
  }, [navigate, dialogs, task])

  return (
    <>
      <VerticalTwoPartsContainer proportions="45_55">
        <HorizontalTwoPartsContainer
          proportions="EQUAL"
          title={[
            'Задание',
            `${task.code}${task.name !== null ? ` (${task.name})` : ''}`
          ]}
          titleRight={props.titleRight}
        >
          <ColumnViewer>
            <ColumnViewerBlock title="действия">
              <ColumnViewerActions
                onUpdateClick={
                  rightsSet.has('UPDATE_TASK') ? handleUpdateClick : undefined
                }
                onCancelClick={
                  rightsSet.has('CANCEL_TASK') &&
                  (task.status === 'CREATED' ||
                    task.status === 'CREATED_PAUSED')
                    ? handleCancelClick
                    : undefined
                }
                onAbortClick={
                  rightsSet.has('ABORT_TASK') &&
                  (task.status === 'LAUNCHED' ||
                    task.status === 'LAUNCHED_PAUSED')
                    ? handleAbortClick
                    : undefined
                }
                onPauseClick={
                  rightsSet.has('PAUSE_TASK') &&
                  (task.status === 'CREATED' || task.status === 'LAUNCHED')
                    ? handlePauseClick
                    : undefined
                }
                onUnpauseClick={
                  rightsSet.has('UNPAUSE_TASK') &&
                  (task.status === 'CREATED_PAUSED' ||
                    task.status === 'LAUNCHED_PAUSED')
                    ? handleUnpauseClick
                    : undefined
                }
                onDeleteClick={
                  rightsSet.has('DELETE_TASK') &&
                  (task.status === 'CANCELED' ||
                    task.status === 'ABORTED_BY_USER' ||
                    task.status === 'ABORTED_DUE_TO_NOT_PASSED' ||
                    task.status === 'COMPLETED_WITH_PROBLEMS' ||
                    task.status === 'COMPLETED')
                    ? handleDeleteClick
                    : undefined
                }
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="основная информация">
              <ColumnViewerItem field="код" val={task.code} />
              <ColumnViewerItem field="название" val={task.name ?? ''} />
              <ColumnViewerItem
                field="статус"
                val={localizationForTaskStatus.get(task.status)}
                Icon={<TaskStatusIcon status={task.status} />}
              />
              <ColumnViewerItem
                field="режим"
                val={localizationForTaskMode.get(task.mode)}
                Icon={<TaskModeIcon mode={task.mode} />}
              />
              <ColumnViewerTime field="время создания" time={task.createTime} />
              <ColumnViewerTime
                field="время запуска"
                time={taskReport.launchTime}
              />
              <ColumnViewerTime
                field="время завершения"
                time={taskReport.finishTime}
              />
              {task.minLaunchTime !== null ? (
                <ColumnViewerTime
                  field="минимальное время запуска"
                  time={task.minLaunchTime}
                />
              ) : null}
              <ColumnViewerRef
                field="общая топология"
                text={props.commonTopology?.code ?? 'УДАЛЕНА'}
                href={`${props.commonTopology === null ? '/history' : ''}/common-topologies/${props.commonTopologyVersion?.resourceId}`}
                // href={`/common-topologies/${props.commonTopologyVersion?.resourceId}/versions/${props.commonTopologyVersion?.transitionNum}`}
              />
              {/* <ColumnViewerItem
                field="приостановлено"
                Icon={<FlagIcon flag={task.paused} />}
              /> */}
              <ColumnViewerRef
                field="история"
                text="ПЕРЕЙТИ"
                href={`/history/tasks/${task.id}`}
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="счетчики тестов">
              <ColumnViewerItem field="всего" val={taskReport.totalCount} />
              <ColumnViewerIconsBlock items={testsCountsItems} />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="описание">
              <ColumnViewerText emptyText="нет" text={task.description?.text} />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="иерархия тестов">
              <ColumnViewerItem
                field="число всех тестов (с вложенными)"
                val={task.allTestsCount}
              />
              <ColumnViewerItem field="число тестов" val={task.testsCount} />
              <ColumnViewerItem
                field="число всех подгрупп (с вложенными)"
                val={task.allSubgroupsCount}
              />
              <ColumnViewerItem
                field="число подгрупп"
                val={task.subgroupsCount}
              />
              <ColumnViewerItem field="число групп" val={task.groupsCount} />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="параметры запуска">
              <ColumnViewerItem
                field="прерывать при непрохождении либо ошибке"
                Icon={<FlagIcon flag={task.abortIfNotPassed} />}
              />
              <ColumnViewerItem
                field="отключить конфигурирование устройств перед запуском тестов"
                Icon={<FlagIcon flag={task.withoutDeviceConfig} />}
              />
              <ColumnViewerItem field="приоритет" val={task.priority} />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="сохраняемые результаты">
              <ColumnViewerChipsBlock
                emptyText="нет"
                items={task.resultsToSave.map((resultToSave) => ({
                  text: localizationForTaskResultToSave.get(resultToSave) ?? ''
                }))}
              />
            </ColumnViewerBlock>
            {task.vertexes.map((vertex) => (
              <ColumnViewerBlock
                key={vertex.vertexName}
                title={`вершина ${vertex.vertexName}`}
              >
                <ColumnViewerRef
                  field="устройство"
                  text={deviceCodeForId.get(vertex.device.id) ?? '???'}
                  href={`/devices/${vertex.device.id}`}
                />
              </ColumnViewerBlock>
            ))}
            <ColumnViewerBlock title="теги">
              <ColumnViewerChipsBlock
                emptyText={props.tags !== null ? 'нет' : '???'}
                items={(props.tags ?? []).map((tag) => ({
                  text: tag.code,
                  href: `/tags/${tag.id}`
                }))}
              />
            </ColumnViewerBlock>
          </ColumnViewer>
          <TopologyConfigSchema
            config={props.commonTopologyVersion?.version.config ?? null}
            nullConfigTitle="схема общей топологии"
          />
        </HorizontalTwoPartsContainer>
        <HorizontalTwoPartsContainer
          proportions={props.children ? 'ONE_TWO' : 'ONE_ZERO'}
        >
          <TestReportsGrid
            key={`${withTest}`}
            tests={props.tests ?? EMPTY_TESTS_ARR}
            testReports={props.testReports ?? EMPTY_TEST_REPORTS_ARR}
            navigationMode={withTest}
            navigationModeSelectedRowId={
              withTest ? (testReportId ?? undefined) : undefined
            }
          />
          {props.children ? props.children : null}
        </HorizontalTwoPartsContainer>
      </VerticalTwoPartsContainer>
      <UpdateTaskFormDialog
        key={updatedTaskId}
        taskId={updatedTaskId}
        setTaskId={setUpdatedTaskId}
        initialTask={task}
        onSuccessUpdateTask={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
