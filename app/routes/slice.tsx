// Project
import type { CommonTopologyPrimary, TaskSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readCommonTopologiesPrimary,
  readSliceTertiary,
  readTasksSecondaryFiltered
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useCommonTopologiesSubscription,
  useTasksFilteredSubscription
} from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { SliceTasksGrid } from '~/components/grids/resources/slice-tasks'
// React router
import type { Route } from './+types/slice'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const sliceId = (() => {
    const parsed = parseInt(params.sliceId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const slice = await readSliceTertiary(sliceId)
  const [commonTopologies, tasks] = await Promise.all([
    readCommonTopologiesPrimary(),
    readTasksSecondaryFiltered(slice?.taskIds ?? null)
  ])
  return {
    sliceId,
    commonTopologies,
    slice,
    tasks
  }
}

export default function SliceRoute({
  loaderData: {
    sliceId,
    commonTopologies: initialCommonTopologies,
    slice,
    tasks: initialTasks
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [commonTopologies, setCommonTopologies] = React.useState<
    CommonTopologyPrimary[] | null
  >(initialCommonTopologies)
  const [tasks, setTasks] = React.useState<TaskSecondary[] | null>(initialTasks)

  useCommonTopologiesSubscription('PRIMARY_PROPS', setCommonTopologies)
  useTasksFilteredSubscription(
    'UP_TO_SECONDARY_PROPS',
    slice?.taskIds ?? null,
    setTasks
  )

  React.useEffect(() => {
    if (
      slice === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_SLICE')
    ) {
      notifier.showError(
        `не удалось загрузить срез заданий с идентификатором ${sliceId}`
      )
    }
  }, [slice, sliceId, notifier])

  React.useEffect(() => {
    if (
      tasks === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TASK')
    ) {
      notifier.showError('не удалось загрузить задания среза')
    }
  }, [tasks, notifier])

  return meta.status === 'AUTHENTICATED' &&
    (meta.selfMeta.rights.includes('READ_SLICE') === false ||
      meta.selfMeta.rights.includes('READ_TASK') === false) ? (
    <ForbiddenScreen />
  ) : slice !== null && tasks !== null ? (
    <SliceTasksGrid
      commonTopologies={commonTopologies}
      tasks={tasks}
      selectedSliceCode={slice.code}
    />
  ) : null
}
