// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadGroupReportWithPrimaryPropsSuccessResultDto,
  ReadGroupReportWithUpToSecondaryPropsSuccessResultDto,
  ReadGroupReportWithUpToTertiaryPropsSuccessResultDto,
  ReadGroupReportWithAllPropsSuccessResultDto,
  ReadGroupReportsWithPrimaryPropsSuccessResultItemDto,
  ReadGroupReportsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/group-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneGroupReport<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadGroupReportWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadGroupReportWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadGroupReportWithUpToTertiaryPropsSuccessResultDto
        : ReadGroupReportWithAllPropsSuccessResultDto
>

type ReadManyGroupReport<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadGroupReportsWithPrimaryPropsSuccessResultItemDto
    : ReadGroupReportsWithUpToSecondaryPropsSuccessResultItemDto
>

function useGroupReportSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  groupReportId: number | null,
  setGroupReportPair: React.Dispatch<
    React.SetStateAction<{
      groupReportId: number | null
      groupReport?: ReadOneGroupReport<Scope> | null
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
      if (groupReportId === null) {
        setGroupReportPair((oldPair) =>
          oldPair.groupReportId === null
            ? { ...oldPair, groupReport: null }
            : oldPair
        )
        return
      }
      try {
        const groupReport = (await serverConnector.readGroupReport(
          { id: groupReportId },
          {
            scope: scope
          }
        )) as ReadOneGroupReport<Scope>
        setGroupReportPair((oldPair) =>
          oldPair.groupReportId === groupReportId
            ? {
                ...oldPair,
                groupReport: groupReport
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить отчет о выполнении группы тестов с идентификатором ${groupReportId}`
          )
        }
      }
    },
    [scope, groupReportId, setGroupReportPair, notifier]
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
    detectedObjects: [groupReportId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    if (groupReportId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'GROUP_REPORT',
        resourceConfig: {
          id: groupReportId
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
  }, [scope, groupReportId, load])
}

/** Subscribe to groupReport updates for existing groupReport state */
export function useGroupReportSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  groupReportId: number | null,
  setGroupReport: React.Dispatch<
    React.SetStateAction<ReadOneGroupReport<Scope> | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [groupReportPair, setGroupReportPair] = React.useState<{
    groupReportId: number | null
    groupReport?: ReadOneGroupReport<Scope> | null
  }>({
    groupReportId: groupReportId,
    groupReport: undefined
  })
  React.useEffect(() => {
    setGroupReportPair((oldPair) => ({
      groupReportId: groupReportId,
      groupReport: oldPair.groupReport
    }))
  }, [groupReportId, setGroupReportPair])
  useGroupReportSubscriptionInner(
    scope,
    groupReportPair.groupReportId,
    setGroupReportPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (groupReportPair.groupReport !== undefined) {
      setGroupReport(groupReportPair.groupReport)
    }
  }, [setGroupReport, groupReportPair.groupReport])
}

/** Subscribe to groupReport updates with initial load */
export function useGroupReport<Scope extends ReadOneResourceScope>(
  scope: Scope,
  groupReportId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [groupReportPair, setGroupReportPair] = React.useState<{
    groupReportId: number | null
    groupReport?: ReadOneGroupReport<Scope> | null
  }>({
    groupReportId: groupReportId,
    groupReport: null
  })
  React.useEffect(() => {
    setGroupReportPair((oldPair) => ({
      groupReportId: groupReportId,
      groupReport: oldPair.groupReport
    }))
  }, [groupReportId, setGroupReportPair])
  useGroupReportSubscriptionInner(
    scope,
    groupReportPair.groupReportId,
    setGroupReportPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return groupReportPair.groupReport ?? null
}

function useGroupReportsSubscriptionInner<Scope extends ReadManyResourceScope>(
  scope: Scope,
  taskId: number | null,
  setGroupReportsPair: React.Dispatch<
    React.SetStateAction<{
      taskId: number | null
      groupReports?: ReadManyGroupReport<Scope>[] | null
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
        setGroupReportsPair((oldPair) =>
          oldPair.taskId === null ? { ...oldPair, groupReports: null } : oldPair
        )
        return
      }
      try {
        const groupReports = (await serverConnector.readGroupReports({
          taskIds: [taskId],
          scope: scope
        })) as ReadManyGroupReport<Scope>[]
        setGroupReportsPair((oldPair) =>
          oldPair.taskId === taskId
            ? {
                ...oldPair,
                groupReports: groupReports
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить актуальный список отчетов о выполнении групп тестов для задания с идентификатором ${taskId}`
          )
        }
      }
    },
    [scope, taskId, setGroupReportsPair, notifier]
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

  // Process task id change or active flag change to true
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
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'GROUP_REPORT'
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
  }, [scope, taskId, load])
}

/** Subscribe to groupReports updates for existing groupReports state */
export function useGroupReportsSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  taskId: number | null,
  setGroupReports: React.Dispatch<
    React.SetStateAction<ReadManyGroupReport<Scope>[] | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [groupReportsPair, setGroupReportsPair] = React.useState<{
    taskId: number | null
    groupReports?: ReadManyGroupReport<Scope>[] | null
  }>({
    taskId: taskId,
    groupReports: undefined
  })
  React.useEffect(() => {
    setGroupReportsPair((oldPair) => ({
      taskId: taskId,
      groupReports: oldPair.groupReports
    }))
  }, [taskId, setGroupReportsPair])
  useGroupReportsSubscriptionInner(
    scope,
    groupReportsPair.taskId,
    setGroupReportsPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (groupReportsPair.groupReports !== undefined) {
      setGroupReports(groupReportsPair.groupReports)
    }
  }, [setGroupReports, groupReportsPair.groupReports])
}

/** Subscribe to groupReports updates with initial load */
export function useGroupReports<Scope extends ReadManyResourceScope>(
  scope: Scope,
  taskId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [groupReportsPair, setGroupReportsPair] = React.useState<{
    taskId: number | null
    groupReports?: ReadManyGroupReport<Scope>[] | null
  }>({
    taskId: taskId,
    groupReports: null
  })
  React.useEffect(() => {
    setGroupReportsPair((oldPair) => ({
      taskId: taskId,
      groupReports: oldPair.groupReports
    }))
  }, [taskId, setGroupReportsPair])
  useGroupReportsSubscriptionInner(
    scope,
    groupReportsPair.taskId,
    setGroupReportsPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return groupReportsPair.groupReports ?? null
}
