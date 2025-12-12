// Project
import type { CommonTopologyPrimary, TaskSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readCommonTopologiesPrimary, readTasksSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useCommonTopologiesSubscription,
  useTasksSubscription
} from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TasksScreen } from '~/components/screens/tasks'
// React router
import type { Route } from './+types/tasks'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [commonTopologies, tasks] = await Promise.all([
    readCommonTopologiesPrimary(),
    readTasksSecondary()
  ])
  return {
    commonTopologies,
    tasks
  }
}

export default function TasksRoute({
  loaderData: { commonTopologies: initialCommonTopologies, tasks: initialTasks }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [commonTopologies, setCommonTopologies] = React.useState<
    CommonTopologyPrimary[] | null
  >(initialCommonTopologies)
  const [tasks, setTasks] = React.useState<TaskSecondary[] | null>(initialTasks)

  useCommonTopologiesSubscription('PRIMARY_PROPS', setCommonTopologies)
  useTasksSubscription('UP_TO_SECONDARY_PROPS', setTasks)

  React.useEffect(() => {
    if (
      tasks === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TASK')
    ) {
      notifier.showError('не удалось загрузить список заданий тестирования')
    }
  }, [tasks, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK') === false ? (
    <ForbiddenScreen />
  ) : tasks !== null ? (
    <TasksScreen commonTopologies={commonTopologies} tasks={tasks}>
      {outlet !== null ? outlet : null}
    </TasksScreen>
  ) : null
}
