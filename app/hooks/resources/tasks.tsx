// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type { TaskPrimary, TaskSecondary, TaskTertiary, TaskAll } from '~/types'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'
// Other
import { isEqual } from 'lodash'

type ReadOneTask<Scope extends ReadOneResourceScope> =
  Scope extends 'PRIMARY_PROPS'
    ? TaskPrimary
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? TaskSecondary
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? TaskTertiary
        : TaskAll

type ReadManyTask<Scope extends ReadManyResourceScope> =
  Scope extends 'PRIMARY_PROPS' ? TaskPrimary : TaskSecondary

const EMPTY_TASKS_ARR: TaskAll[] = []

function useTaskSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  taskId: number | null,
  setTaskPair: React.Dispatch<
    React.SetStateAction<{
      taskId: number | null
      task?: ReadOneTask<Scope> | null
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
            `не удалось загрузить задание тестирования с идентификатором ${taskId}`
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

/** Subscribe to task updates for existing task state */
export function useTaskSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  taskId: number | null,
  setTask: React.Dispatch<React.SetStateAction<ReadOneTask<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [taskPair, setTaskPair] = React.useState<{
    taskId: number | null
    task?: ReadOneTask<Scope> | null
  }>({
    taskId: taskId,
    task: undefined
  })
  React.useEffect(() => {
    setTaskPair((oldPair) => ({
      taskId: taskId,
      task: oldPair.task
    }))
  }, [taskId, setTaskPair])
  useTaskSubscriptionInner(
    scope,
    taskPair.taskId,
    setTaskPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (taskPair.task !== undefined) {
      setTask(taskPair.task)
    }
  }, [setTask, taskPair.task])
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
    task?: ReadOneTask<Scope> | null
  }>({
    taskId: taskId,
    task: null
  })
  React.useEffect(() => {
    setTaskPair((oldPair) => ({
      taskId: taskId,
      task: oldPair.task
    }))
  }, [taskId, setTaskPair])
  useTaskSubscriptionInner(
    scope,
    taskPair.taskId,
    setTaskPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return taskPair.task ?? null
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
          notifier.showWarning(
            'не удалось загрузить актуальный список заданий тестирования'
          )
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

function useTasksFilteredSubscriptionInner<Scope extends ReadManyResourceScope>(
  scope: Scope,
  taskIds: number[] | null,
  setTasksPair: React.Dispatch<
    React.SetStateAction<{
      taskIds: number[] | null
      tasks?: ReadManyTask<Scope>[] | null
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
      try {
        const tasks =
          taskIds !== null
            ? ((await serverConnector.readTasks({
                ids: taskIds,
                scope: scope
              })) as ReadManyTask<Scope>[])
            : EMPTY_TASKS_ARR
        setTasksPair((oldPair) =>
          isEqual(oldPair.taskIds, taskIds)
            ? {
                ...oldPair,
                tasks: tasks
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning('не удалось загрузить актуальный список заданий')
        }
      }
    },
    [scope, taskIds, setTasksPair, notifier]
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

  // Process task ids change or active flag change to true
  useChangeDetector({
    detectedObjects: [taskIds, active],
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
  }, [scope, taskIds, load])
}

/** Subscribe to tasks updates for existing tasks state */
export function useTasksFilteredSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  taskIds: number[] | null,
  setTasks: React.Dispatch<React.SetStateAction<ReadManyTask<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [tasksPair, setTasksPair] = React.useState<{
    taskIds: number[] | null
    tasks?: ReadManyTask<Scope>[] | null
  }>({
    taskIds: taskIds,
    tasks: undefined
  })
  React.useEffect(() => {
    setTasksPair((oldPair) => ({
      taskIds: taskIds,
      tasks: oldPair.tasks
    }))
  }, [taskIds, setTasksPair])
  useTasksFilteredSubscriptionInner(
    scope,
    tasksPair.taskIds,
    setTasksPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (tasksPair.tasks !== undefined) {
      setTasks(tasksPair.tasks)
    }
  }, [setTasks, tasksPair.tasks])
}

/** Subscribe to tasks updates with initial load */
export function useTasksFiltered<Scope extends ReadManyResourceScope>(
  scope: Scope,
  taskIds: number[] | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [tasksPair, setTasksPair] = React.useState<{
    taskIds: number[] | null
    tasks?: ReadManyTask<Scope>[] | null
  }>({
    taskIds: taskIds,
    tasks: null
  })
  React.useEffect(() => {
    setTasksPair((oldPair) => ({
      taskIds: taskIds,
      tasks: oldPair.tasks
    }))
  }, [taskIds, setTasksPair])
  useTasksFilteredSubscriptionInner(
    scope,
    tasksPair.taskIds,
    setTasksPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return tasksPair.tasks ?? null
}
