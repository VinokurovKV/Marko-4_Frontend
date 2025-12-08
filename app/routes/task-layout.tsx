// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TaskLayoutScreen } from '~/components/screens/task-layout'
// React router
import type { Route } from './+types/task-layout'
import { Outlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [commonTopologies, tasks] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null, null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_COMMON_TOPOLOGY')
          ? serverConnector
              .readCommonTopologies({
                scope: 'PRIMARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null),
        rights.includes('READ_TASK')
          ? serverConnector
              .readTasks({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    commonTopologies,
    tasks
  }
}

export default function MetaRoute({
  loaderData: { commonTopologies, tasks }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

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
  ) : (
    <TaskLayoutScreen
      initialCommonTopologies={commonTopologies}
      initialTasks={tasks ?? []}
    >
      {<Outlet />}
    </TaskLayoutScreen>
  )
}
