// Project
import type { ReadTestWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { ReadTasksWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tasks.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { useTaskSubscription } from '~/hooks/resources'
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import { TwoPartsContainer } from '../containers/two-parts-container'
import { type TasksGridProps, TasksGrid } from '../grids/resources/tasks'
import {
  type TaskViewerProps,
  TaskViewer
} from '../single-resource-viewers/resources/task'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import TaskIcon from '@mui/icons-material/Task'

type Test = DtoWithoutEnums<ReadTestWithPrimaryPropsSuccessResultDto>
type Task = DtoWithoutEnums<ReadTasksWithPrimaryPropsSuccessResultItemDto>

export type TestReportLayoutScreenProps = Omit<
  TasksGridProps,
  'navigationMode' | 'navigationModeSelectedRowId'
> &
  Omit<TaskViewerProps, 'tests'> & {
    testReportId: number
    tests: Test[]
    children: React.ReactNode
  }

export function TestReportLayoutScreen(props: TestReportLayoutScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/tasks/:taskId/:testId', pathname)
  const taskId = (() => {
    const parsed =
      match?.params.taskId !== undefined ? parseInt(match.params.taskId) : null
    return parsed === null || isNaN(parsed) ? null : parsed
  })()
  const testId = (() => {
    const parsed =
      match?.params.testId !== undefined ? parseInt(match.params.testId) : null
    return parsed === null || isNaN(parsed) ? null : parsed
  })()
  const [task, setTask] = React.useState<Task | null>(
    props.initialTasks.find((task) => task.id === taskId) ?? null
  )

  useTaskSubscription('PRIMARY_PROPS', taskId, setTask)

  const testCode = React.useMemo(
    () =>
      (props.tests.find((test) => test.id === testId) ?? null)?.code ??
      'УДАЛЕН',
    [props.tests]
  )

  const taskCode = task?.code ?? '???'

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'задания тестирования',
        href: '/tasks',
        Icon: TaskIcon
      },
      {
        title: taskCode,
        href: `/tasks/${taskId}`
      },
      {
        title: testCode,
        href: `/tasks/${taskId}/${testId}`
      }
    ],
    [taskId, testId, taskCode, testCode]
  )

  return (
    <LayoutScreenContainer
      title="задания тестирования"
      breadcrumbsItems={breadcrumbsItems}
    >
      <TwoPartsContainer proportions="ONE_TWO">
        <TasksGrid
          initialCommonTopologies={props.initialCommonTopologies}
          initialTasks={props.initialTasks}
          navigationMode={true}
          navigationModeSelectedRowId={taskId ?? undefined}
        />
        <TaskViewer
          tags={props.tags}
          commonTopology={props.commonTopology}
          commonTopologyVersion={props.commonTopologyVersion}
          tests={props.tests}
          task={props.task}
          testReports={props.testReports}
          taskReport={props.taskReport}
          testReportsGridNavigationMode={true}
          testReportsGridNavigationModeSelectedRowId={props.testReportId}
        >
          {props.children}
        </TaskViewer>
      </TwoPartsContainer>
    </LayoutScreenContainer>
  )
}
