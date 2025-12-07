// // Project
// import type { ReadTasksWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tasks.dto'
// import type { DtoWithoutEnums } from '@common/dto-without-enums'
// import { useTaskSubscription } from '~/hooks/resources'
// import { type ProjBreadcrumbsProps } from '../breadcrumbs'
// import { LayoutScreenContainer } from '../containers/layout-screen-container'
// import { TwoPartsContainer } from '../containers/two-parts-container'
// import { type TasksGridProps, TasksGrid } from '../grids/resources/tasks'
// // React router
// import { matchPath, useLocation } from 'react-router'
// // React
// import * as React from 'react'
// // Material UI
// import TaskIcon from '@mui/icons-material/Task'

// type Task = DtoWithoutEnums<ReadTasksWithPrimaryPropsSuccessResultItemDto>

// export interface TaskLayoutScreenProps extends TasksGridProps {
//   children: React.ReactNode
// }

// export function TaskLayoutScreen(props: TaskLayoutScreenProps) {
//   const { pathname } = useLocation()
//   const match = matchPath('/tasks/:taskId', pathname)
//   const taskId = (() => {
//     const parsed =
//       match?.params.taskId !== undefined ? parseInt(match.params.taskId) : null
//     return parsed === null || isNaN(parsed) ? null : parsed
//   })()

//   const [task, setTask] = React.useState<{
//     taskId: number | null
//     task: Task | null
//   }>({
//     taskId: taskId,
//     task: props.initialTasks.find((task) => task.id === taskId) ?? null
//   })

//   useTaskSubscription('PRIMARY_PROPS', taskId, setTask)

//   const title = `задание тестирования ${task.task?.code ?? '???'}`
//   const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
//     () => [
//       {
//         title: 'задания тестирования',
//         href: '/tasks',
//         Icon: TaskIcon
//       },
//       {
//         title: title,
//         href: `/tasks/${taskId}`
//       }
//     ],
//     []
//   )
//   return (
//     <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
//       <TwoPartsContainer>
//         <TasksGrid {...props} />
//         {props.children}
//       </TwoPartsContainer>
//     </LayoutScreenContainer>
//   )
// }
