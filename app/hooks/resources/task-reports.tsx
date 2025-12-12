// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  TaskReportPrimary,
  TaskReportSecondary,
  TaskReportTertiary,
  TaskReportAll
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneTaskReport<Scope extends ReadOneResourceScope> =
  Scope extends 'PRIMARY_PROPS'
    ? TaskReportPrimary
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? TaskReportSecondary
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? TaskReportTertiary
        : TaskReportAll

type ReadManyTaskReport<Scope extends ReadManyResourceScope> =
  Scope extends 'PRIMARY_PROPS' ? TaskReportPrimary : TaskReportSecondary

function useTaskReportSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  taskReportId: number | null,
  setTaskReportPair: React.Dispatch<
    React.SetStateAction<{
      taskReportId: number | null
      taskReport?: ReadOneTaskReport<Scope> | null
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
      if (taskReportId === null) {
        setTaskReportPair((oldPair) =>
          oldPair.taskReportId === null
            ? { ...oldPair, taskReport: null }
            : oldPair
        )
        return
      }
      try {
        const taskReport = (await serverConnector.readTaskReport(
          { id: taskReportId },
          {
            scope: scope
          }
        )) as ReadOneTaskReport<Scope>
        setTaskReportPair((oldPair) =>
          oldPair.taskReportId === taskReportId
            ? {
                ...oldPair,
                taskReport: taskReport
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить отчет о выполнении задания тестирования с идентификатором ${taskReportId}`
          )
        }
      }
    },
    [scope, taskReportId, setTaskReportPair, notifier]
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
    detectedObjects: [taskReportId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    if (taskReportId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'TASK_REPORT',
        resourceConfig: {
          id: taskReportId
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
  }, [scope, taskReportId, load])
}

/** Subscribe to taskReport updates for existing taskReport state */
export function useTaskReportSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  taskReportId: number | null,
  setTaskReport: React.Dispatch<
    React.SetStateAction<ReadOneTaskReport<Scope> | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [taskReportPair, setTaskReportPair] = React.useState<{
    taskReportId: number | null
    taskReport?: ReadOneTaskReport<Scope> | null
  }>({
    taskReportId: taskReportId,
    taskReport: undefined
  })
  React.useEffect(() => {
    setTaskReportPair((oldPair) => ({
      taskReportId: taskReportId,
      taskReport: oldPair.taskReport
    }))
  }, [taskReportId, setTaskReportPair])
  useTaskReportSubscriptionInner(
    scope,
    taskReportPair.taskReportId,
    setTaskReportPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (taskReportPair.taskReport !== undefined) {
      setTaskReport(taskReportPair.taskReport)
    }
  }, [setTaskReport, taskReportPair.taskReport])
}

/** Subscribe to taskReport updates with initial load */
export function useTaskReport<Scope extends ReadOneResourceScope>(
  scope: Scope,
  taskReportId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [taskReportPair, setTaskReportPair] = React.useState<{
    taskReportId: number | null
    taskReport?: ReadOneTaskReport<Scope> | null
  }>({
    taskReportId: taskReportId,
    taskReport: null
  })
  React.useEffect(() => {
    setTaskReportPair((oldPair) => ({
      taskReportId: taskReportId,
      taskReport: oldPair.taskReport
    }))
  }, [taskReportId, setTaskReportPair])
  useTaskReportSubscriptionInner(
    scope,
    taskReportPair.taskReportId,
    setTaskReportPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return taskReportPair.taskReport ?? null
}

/** Subscribe to taskReports updates for existing taskReports state */
export function useTaskReportsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setTaskReports:
    | React.Dispatch<React.SetStateAction<ReadManyTaskReport<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyTaskReport<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        const taskReports = (await serverConnector.readTaskReports({
          scope: scope
        })) as ReadManyTaskReport<Scope>[]
        setTaskReports(taskReports)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список отчетов о выполнении заданий тестирования'
          )
        }
      }
    },
    [scope, setTaskReports, notifier]
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
        type: 'TASK_REPORT'
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

/** Subscribe to taskReports updates with initial load */
export function useTaskReports<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [taskReports, setTaskReports] = React.useState<
    ReadManyTaskReport<Scope>[] | null
  >(null)
  useTaskReportsSubscription(
    scope,
    setTaskReports,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return taskReports
}
