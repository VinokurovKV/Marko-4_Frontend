// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import { type TasksGridProps, TasksGrid } from '../grids/resources/tasks'
// React
import * as React from 'react'
// Material UI
import TaskIcon from '@mui/icons-material/Task'

export type TasksScreenProps = TasksGridProps

export function TasksScreen(props: TasksScreenProps) {
  const title = 'задания тестирования'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: title,
        href: '/tasks',
        Icon: TaskIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
      <TasksGrid {...props} />
    </LayoutScreenContainer>
  )
}
