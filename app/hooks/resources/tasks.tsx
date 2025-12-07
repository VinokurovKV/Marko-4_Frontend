// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadTaskWithPrimaryPropsSuccessResultDto,
  ReadTaskWithUpToSecondaryPropsSuccessResultDto,
  ReadTaskWithUpToTertiaryPropsSuccessResultDto,
  ReadTaskWithAllPropsSuccessResultDto,
  ReadTasksWithPrimaryPropsSuccessResultItemDto,
  ReadTasksWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/tasks.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneTask<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadTaskWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadTaskWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadTaskWithUpToTertiaryPropsSuccessResultDto
        : ReadTaskWithAllPropsSuccessResultDto
>

type ReadManyTask<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadTasksWithPrimaryPropsSuccessResultItemDto
    : ReadTasksWithUpToSecondaryPropsSuccessResultItemDto
>

/** Subscribe to task updates for existing task state */
export function useTaskSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  taskId: number | null,
  setTaskPair: React.Dispatch<
    React.SetStateAction<{
      taskId: number | null
      task: ReadOneTask<Scope> | null
    }>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (taskId === null) {
        setTaskPair((oldPair) =>
          oldPair.taskId === null ? { ...oldPair, task: null } : oldPair
        )
        return
      }
      try {
        const task = (await serverConnector.readTask(
          { id: taskId },
          {
            scope: scope
          }
        )) as ReadOneTask<Scope>
        setTaskPair((oldPair) =>
          oldPair.taskId === taskId
            ? {
                ...oldPair,
                task: task
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить задание с идентификатором ${taskId}`
          )
        }
      }
    },
    [scope, taskId, setTaskPair, notifier]
  )

  // Initial load
  React.useEffect(() => {
    setInitialized(true)
    if (active === false || withInitialLoad === false || initialized) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [
    scope,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active,
    initialized,
    setInitialized,
    load
  ])

  // Process resource id change or active flag change to true
  useChangeDetector({
    detectedObjects: [taskId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    if (taskId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'TASK',
        resourceConfig: {
          id: taskId
        }
      },
      (data) => {
        ;(() => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope !== 'PRIMARY_PROPS') ||
            (updateScope.tertiaryProps &&
              (scope === 'UP_TO_TERTIARY_PROPS' || scope === 'ALL_PROPS')) ||
            (updateScope.quaternaryProps && scope === 'ALL_PROPS')
          ) {
            void load(true)
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [scope, taskId, load])
}

/** Subscribe to task updates with initial load */
export function useTask<Scope extends ReadOneResourceScope>(
  scope: Scope,
  taskId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [taskPair, setTaskPair] = React.useState<{
    taskId: number | null
    task: ReadOneTask<Scope> | null
  }>({
    taskId: null,
    task: null
  })
  React.useEffect(() => {
    setTaskPair((oldPair) => ({
      taskId: taskId,
      task: oldPair.task
    }))
  }, [taskId, setTaskPair])
  useTaskSubscription(
    scope,
    taskPair.taskId,
    setTaskPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return taskPair.task
}

/** Subscribe to tasks updates for existing tasks state */
export function useTasksSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setTasks:
    | React.Dispatch<React.SetStateAction<ReadManyTask<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyTask<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        const tasks = (await serverConnector.readTasks({
          scope: scope
        })) as ReadManyTask<Scope>[]
        setTasks(tasks)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning('не удалось загрузить актуальный список заданий')
        }
      }
    },
    [scope, setTasks, notifier]
  )

  // Initial load
  React.useEffect(() => {
    setInitialized(true)
    if (active === false || withInitialLoad === false || initialized) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [
    scope,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active,
    initialized,
    setInitialized,
    load
  ])

  // Process active flag change to true
  useChangeDetector({
    detectedObjects: [active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'TASK'
      },
      (data) => {
        ;(() => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            void load(true)
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [scope, load])
}

/** Subscribe to tasks updates with initial load */
export function useTasks<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [tasks, setTasks] = React.useState<ReadManyTask<Scope>[] | null>(null)
  useTasksSubscription(
    scope,
    setTasks,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return tasks
}
