// // Project
// import { serverConnector } from '~/server-connector'
// import { useNotifier } from '~/providers/notifier'
// import { useMeta } from '~/providers/meta'
// import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// import { TaskScreen } from '~/components/screens/task'
// // React router
// import type { Route } from './+types/tasks'
// // React
// import * as React from 'react'

// export async function clientLoader({ params }: Route.ClientLoaderArgs) {
//   const taskId = params.taskId
//   await serverConnector.connect()
//   const [task] = await (async () => {
//     if (serverConnector.meta.status !== 'AUTHENTICATED') {
//       return [null]
//     } else {
//       const rights = serverConnector.meta.selfMeta.rights
//       return await Promise.all([
//         rights.includes('READ_TASK')
//           ? serverConnector
//               .readTask(
//                 {
//                   id: taskId
//                 },
//                 {
//                   scope: 'UP_TO_TERTIARY_PROPS'
//                 }
//               )
//               .catch(() => null)
//           : Promise.resolve(null)
//       ])
//     }
//   })()
//   const [commonTopology] = await (async () => {
//     if (serverConnector.meta.status !== 'AUTHENTICATED' || task === null) {
//       return [null]
//     } else {
//       const rights = serverConnector.meta.selfMeta.rights
//       return await Promise.all([
//         rights.includes('READ_COMMON_TOPOLOGY')
//           ? serverConnector
//               .readCommonTopology(
//                 { id: task.commonTopology.id },
//                 {
//                   scope: 'PRIMARY_PROPS'
//                 }
//               )
//               .catch(() => null)
//           : Promise.resolve(null)
//       ])
//     }
//   })()
//   return {
//     commonTopology,
//     task
//   }
// }

// export default function MetaRoute({
//   loaderData: { commonTopologies, tasks }
// }: Route.ComponentProps) {
//   const notifier = useNotifier()
//   const meta = useMeta()

//   React.useEffect(() => {
//     if (
//       tasks === null &&
//       serverConnector.meta.status === 'AUTHENTICATED' &&
//       serverConnector.meta.selfMeta.rights.includes('READ_TASK')
//     ) {
//       notifier.showError('не удалось загрузить список заданий тестирования')
//     }
//   }, [tasks, notifier])

//   return meta.status === 'AUTHENTICATED' &&
//     meta.selfMeta.rights.includes('READ_TASK') === false ? (
//     <ForbiddenScreen />
//   ) : (
//     <TasksScreen
//       initialCommonTopologies={commonTopologies}
//       initialTasks={tasks ?? []}
//     />
//   )
// }
