// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadTestReportWithPrimaryPropsSuccessResultDto,
  ReadTestReportWithUpToSecondaryPropsSuccessResultDto,
  ReadTestReportWithUpToTertiaryPropsSuccessResultDto,
  ReadTestReportWithAllPropsSuccessResultDto,
  ReadTestReportsWithPrimaryPropsSuccessResultItemDto,
  ReadTestReportsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/test-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneTestReport<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadTestReportWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadTestReportWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadTestReportWithUpToTertiaryPropsSuccessResultDto
        : ReadTestReportWithAllPropsSuccessResultDto
>

type ReadManyTestReport<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadTestReportsWithPrimaryPropsSuccessResultItemDto
    : ReadTestReportsWithUpToSecondaryPropsSuccessResultItemDto
>

function useTestReportSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  testReportId: number | null,
  setTestReportPair: React.Dispatch<
    React.SetStateAction<{
      testReportId: number | null
      testReport?: ReadOneTestReport<Scope> | null
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
      if (testReportId === null) {
        setTestReportPair((oldPair) =>
          oldPair.testReportId === null
            ? { ...oldPair, testReport: null }
            : oldPair
        )
        return
      }
      try {
        const testReport = (await serverConnector.readTestReport(
          { id: testReportId },
          {
            scope: scope
          }
        )) as ReadOneTestReport<Scope>
        setTestReportPair((oldPair) =>
          oldPair.testReportId === testReportId
            ? {
                ...oldPair,
                testReport: testReport
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить отчет о выполнении теста с идентификатором ${testReportId}`
          )
        }
      }
    },
    [scope, testReportId, setTestReportPair, notifier]
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
    detectedObjects: [testReportId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    if (testReportId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'TEST_REPORT',
        resourceConfig: {
          id: testReportId
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
  }, [scope, testReportId, load])
}

/** Subscribe to testReport updates for existing testReport state */
export function useTestReportSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  testReportId: number | null,
  setTestReport: React.Dispatch<
    React.SetStateAction<ReadOneTestReport<Scope> | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [testReportPair, setTestReportPair] = React.useState<{
    testReportId: number | null
    testReport?: ReadOneTestReport<Scope> | null
  }>({
    testReportId: testReportId,
    testReport: undefined
  })
  React.useEffect(() => {
    setTestReportPair((oldPair) => ({
      testReportId: testReportId,
      testReport: oldPair.testReport
    }))
  }, [testReportId, setTestReportPair])
  useTestReportSubscriptionInner(
    scope,
    testReportPair.testReportId,
    setTestReportPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (testReportPair.testReport !== undefined) {
      setTestReport(testReportPair.testReport)
    }
  }, [setTestReport, testReportPair.testReport])
}

/** Subscribe to testReport updates with initial load */
export function useTestReport<Scope extends ReadOneResourceScope>(
  scope: Scope,
  testReportId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [testReportPair, setTestReportPair] = React.useState<{
    testReportId: number | null
    testReport?: ReadOneTestReport<Scope> | null
  }>({
    testReportId: testReportId,
    testReport: null
  })
  React.useEffect(() => {
    setTestReportPair((oldPair) => ({
      testReportId: testReportId,
      testReport: oldPair.testReport
    }))
  }, [testReportId, setTestReportPair])
  useTestReportSubscriptionInner(
    scope,
    testReportPair.testReportId,
    setTestReportPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return testReportPair.testReport ?? null
}

function useTestReportsSubscriptionInner<Scope extends ReadManyResourceScope>(
  scope: Scope,
  taskId: number | null,
  setTestReportsPair: React.Dispatch<
    React.SetStateAction<{
      taskId: number | null
      testReports?: ReadManyTestReport<Scope>[] | null
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
        setTestReportsPair((oldPair) =>
          oldPair.taskId === null ? { ...oldPair, testReports: null } : oldPair
        )
        return
      }
      try {
        const testReports = (await serverConnector.readTestReports({
          taskIds: [taskId],
          scope: scope
        })) as ReadManyTestReport<Scope>[]
        setTestReportsPair((oldPair) =>
          oldPair.taskId === taskId
            ? {
                ...oldPair,
                testReports: testReports
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить актуальный список отчетов о выполнении теста для задания с идентификатором ${taskId}`
          )
        }
      }
    },
    [scope, taskId, setTestReportsPair, notifier]
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
        type: 'TEST_REPORT'
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

/** Subscribe to testReports updates for existing testReports state */
export function useTestReportsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  taskId: number | null,
  setTestReports: React.Dispatch<
    React.SetStateAction<ReadManyTestReport<Scope>[] | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [testReportsPair, setTestReportsPair] = React.useState<{
    taskId: number | null
    testReports?: ReadManyTestReport<Scope>[] | null
  }>({
    taskId: taskId,
    testReports: undefined
  })
  React.useEffect(() => {
    setTestReportsPair((oldPair) => ({
      taskId: taskId,
      testReports: oldPair.testReports
    }))
  }, [taskId, setTestReportsPair])
  useTestReportsSubscriptionInner(
    scope,
    testReportsPair.taskId,
    setTestReportsPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (testReportsPair.testReports !== undefined) {
      setTestReports(testReportsPair.testReports)
    }
  }, [setTestReports, testReportsPair.testReports])
}

/** Subscribe to testReports updates with initial load */
export function useTestReports<Scope extends ReadManyResourceScope>(
  scope: Scope,
  taskId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [testReportsPair, setTestReportsPair] = React.useState<{
    taskId: number | null
    testReports?: ReadManyTestReport<Scope>[] | null
  }>({
    taskId: taskId,
    testReports: null
  })
  React.useEffect(() => {
    setTestReportsPair((oldPair) => ({
      taskId: taskId,
      testReports: oldPair.testReports
    }))
  }, [taskId, setTestReportsPair])
  useTestReportsSubscriptionInner(
    scope,
    testReportsPair.taskId,
    setTestReportsPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return testReportsPair.testReports ?? null
}
