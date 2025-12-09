// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadSubgroupReportWithPrimaryPropsSuccessResultDto,
  ReadSubgroupReportWithUpToSecondaryPropsSuccessResultDto,
  ReadSubgroupReportWithUpToTertiaryPropsSuccessResultDto,
  ReadSubgroupReportWithAllPropsSuccessResultDto,
  ReadSubgroupReportsWithPrimaryPropsSuccessResultItemDto,
  ReadSubgroupReportsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/subgroup-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneSubgroupReport<Scope extends ReadOneResourceScope> =
  DtoWithoutEnums<
    Scope extends 'PRIMARY_PROPS'
      ? ReadSubgroupReportWithPrimaryPropsSuccessResultDto
      : Scope extends 'UP_TO_SECONDARY_PROPS'
        ? ReadSubgroupReportWithUpToSecondaryPropsSuccessResultDto
        : Scope extends 'UP_TO_TERTIARY_PROPS'
          ? ReadSubgroupReportWithUpToTertiaryPropsSuccessResultDto
          : ReadSubgroupReportWithAllPropsSuccessResultDto
  >

type ReadManySubgroupReport<Scope extends ReadManyResourceScope> =
  DtoWithoutEnums<
    Scope extends 'PRIMARY_PROPS'
      ? ReadSubgroupReportsWithPrimaryPropsSuccessResultItemDto
      : ReadSubgroupReportsWithUpToSecondaryPropsSuccessResultItemDto
  >

function useSubgroupReportSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  subgroupReportId: number | null,
  setSubgroupReportPair: React.Dispatch<
    React.SetStateAction<{
      subgroupReportId: number | null
      subgroupReport?: ReadOneSubgroupReport<Scope> | null
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
      if (subgroupReportId === null) {
        setSubgroupReportPair((oldPair) =>
          oldPair.subgroupReportId === null
            ? { ...oldPair, subgroupReport: null }
            : oldPair
        )
        return
      }
      try {
        const subgroupReport = (await serverConnector.readSubgroupReport(
          { id: subgroupReportId },
          {
            scope: scope
          }
        )) as ReadOneSubgroupReport<Scope>
        setSubgroupReportPair((oldPair) =>
          oldPair.subgroupReportId === subgroupReportId
            ? {
                ...oldPair,
                subgroupReport: subgroupReport
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить отчет о выполнении подгруппы тестов с идентификатором ${subgroupReportId}`
          )
        }
      }
    },
    [scope, subgroupReportId, setSubgroupReportPair, notifier]
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
    detectedObjects: [subgroupReportId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    if (subgroupReportId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'SUBGROUP_REPORT',
        resourceConfig: {
          id: subgroupReportId
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
  }, [scope, subgroupReportId, load])
}

/** Subscribe to subgroupReport updates for existing subgroupReport state */
export function useSubgroupReportSubscription<
  Scope extends ReadOneResourceScope
>(
  scope: Scope,
  subgroupReportId: number | null,
  setSubgroupReport: React.Dispatch<
    React.SetStateAction<ReadOneSubgroupReport<Scope> | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [subgroupReportPair, setSubgroupReportPair] = React.useState<{
    subgroupReportId: number | null
    subgroupReport?: ReadOneSubgroupReport<Scope> | null
  }>({
    subgroupReportId: subgroupReportId,
    subgroupReport: undefined
  })
  React.useEffect(() => {
    setSubgroupReportPair((oldPair) => ({
      subgroupReportId: subgroupReportId,
      subgroupReport: oldPair.subgroupReport
    }))
  }, [subgroupReportId, setSubgroupReportPair])
  useSubgroupReportSubscriptionInner(
    scope,
    subgroupReportPair.subgroupReportId,
    setSubgroupReportPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (subgroupReportPair.subgroupReport !== undefined) {
      setSubgroupReport(subgroupReportPair.subgroupReport)
    }
  }, [setSubgroupReport, subgroupReportPair.subgroupReport])
}

/** Subscribe to subgroupReport updates with initial load */
export function useSubgroupReport<Scope extends ReadOneResourceScope>(
  scope: Scope,
  subgroupReportId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [subgroupReportPair, setSubgroupReportPair] = React.useState<{
    subgroupReportId: number | null
    subgroupReport?: ReadOneSubgroupReport<Scope> | null
  }>({
    subgroupReportId: subgroupReportId,
    subgroupReport: null
  })
  React.useEffect(() => {
    setSubgroupReportPair((oldPair) => ({
      subgroupReportId: subgroupReportId,
      subgroupReport: oldPair.subgroupReport
    }))
  }, [subgroupReportId, setSubgroupReportPair])
  useSubgroupReportSubscriptionInner(
    scope,
    subgroupReportPair.subgroupReportId,
    setSubgroupReportPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return subgroupReportPair.subgroupReport ?? null
}

function useSubgroupReportsSubscriptionInner<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  taskId: number | null,
  setSubgroupReportsPair: React.Dispatch<
    React.SetStateAction<{
      taskId: number | null
      subgroupReports?: ReadManySubgroupReport<Scope>[] | null
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
        setSubgroupReportsPair((oldPair) =>
          oldPair.taskId === null
            ? { ...oldPair, subgroupReports: null }
            : oldPair
        )
        return
      }
      try {
        const subgroupReports = (await serverConnector.readSubgroupReports({
          taskIds: [taskId],
          scope: scope
        })) as ReadManySubgroupReport<Scope>[]
        setSubgroupReportsPair((oldPair) =>
          oldPair.taskId === taskId
            ? {
                ...oldPair,
                subgroupReports: subgroupReports
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить актуальный список отчетов о выполнении подгрупп тестов для задания с идентификатором ${taskId}`
          )
        }
      }
    },
    [scope, taskId, setSubgroupReportsPair, notifier]
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
        type: 'SUBGROUP_REPORT'
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

/** Subscribe to subgroupReports updates for existing subgroupReports state */
export function useSubgroupReportsSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  taskId: number | null,
  setSubgroupReports: React.Dispatch<
    React.SetStateAction<ReadManySubgroupReport<Scope>[] | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [subgroupReportsPair, setSubgroupReportsPair] = React.useState<{
    taskId: number | null
    subgroupReports?: ReadManySubgroupReport<Scope>[] | null
  }>({
    taskId: taskId,
    subgroupReports: undefined
  })
  React.useEffect(() => {
    setSubgroupReportsPair((oldPair) => ({
      taskId: taskId,
      subgroupReports: oldPair.subgroupReports
    }))
  }, [taskId, setSubgroupReportsPair])
  useSubgroupReportsSubscriptionInner(
    scope,
    subgroupReportsPair.taskId,
    setSubgroupReportsPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (subgroupReportsPair.subgroupReports !== undefined) {
      setSubgroupReports(subgroupReportsPair.subgroupReports)
    }
  }, [setSubgroupReports, subgroupReportsPair.subgroupReports])
}

/** Subscribe to subgroupReports updates with initial load */
export function useSubgroupReports<Scope extends ReadManyResourceScope>(
  scope: Scope,
  taskId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [subgroupReportsPair, setSubgroupReportsPair] = React.useState<{
    taskId: number | null
    subgroupReports?: ReadManySubgroupReport<Scope>[] | null
  }>({
    taskId: taskId,
    subgroupReports: null
  })
  React.useEffect(() => {
    setSubgroupReportsPair((oldPair) => ({
      taskId: taskId,
      subgroupReports: oldPair.subgroupReports
    }))
  }, [taskId, setSubgroupReportsPair])
  useSubgroupReportsSubscriptionInner(
    scope,
    subgroupReportsPair.taskId,
    setSubgroupReportsPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return subgroupReportsPair.subgroupReports ?? null
}
