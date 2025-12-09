// Project
import type { ReadTasksWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tasks.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { useTaskSubscription } from '~/hooks/resources'
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import { TwoPartsContainer } from '../containers/two-parts-container'
import { type TasksGridProps, TasksGrid } from '../grids/resources/tasks'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import TaskIcon from '@mui/icons-material/Task'

type Task = DtoWithoutEnums<ReadTasksWithPrimaryPropsSuccessResultItemDto>

export interface TaskLayoutScreenProps
  extends Omit<
    TasksGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function TaskLayoutScreen(props: TaskLayoutScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/tasks/:taskId', pathname)
  const taskId = (() => {
    const parsed =
      match?.params.taskId !== undefined ? parseInt(match.params.taskId) : null
    return parsed === null || isNaN(parsed) ? null : parsed
  })()

  const [task, setTask] = React.useState<Task | null>(
    props.initialTasks.find((task) => task.id === taskId) ?? null
  )

  useTaskSubscription('PRIMARY_PROPS', taskId, setTask)

  const tascCode = task?.code ?? '???'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'задания тестирования',
        href: '/tasks',
        Icon: TaskIcon
      },
      {
        title: tascCode,
        href: `/tasks/${taskId}`
      }
    ],
    [taskId, tascCode]
  )
  return (
    <LayoutScreenContainer
      title="задания тестирования"
      breadcrumbsItems={breadcrumbsItems}
    >
      <TwoPartsContainer proportions="ONE_TWO">
        <TasksGrid
          {...props}
          navigationMode={true}
          navigationModeSelectedRowId={taskId ?? undefined}
        />
        {props.children}
      </TwoPartsContainer>
    </LayoutScreenContainer>
  )
}
