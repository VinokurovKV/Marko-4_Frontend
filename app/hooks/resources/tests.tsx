// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  TestsFilter,
  TestPrimary,
  TestSecondary,
  TestTertiary,
  TestAll
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'
// Other
import { isEqual } from 'lodash'

type ReadOneTest<Scope extends ReadOneResourceScope> =
  Scope extends 'PRIMARY_PROPS'
    ? TestPrimary
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? TestSecondary
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? TestTertiary
        : TestAll

type ReadManyTest<Scope extends ReadManyResourceScope> =
  Scope extends 'PRIMARY_PROPS' ? TestPrimary : TestSecondary

const EMPTY_TESTS_ARR: TestAll[] = []

function useTestSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  testId: number | null,
  setTestPair: React.Dispatch<
    React.SetStateAction<{
      testId: number | null
      test?: ReadOneTest<Scope> | null
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
      if (testId === null) {
        setTestPair((oldPair) =>
          oldPair.testId === null ? { ...oldPair, test: null } : oldPair
        )
        return
      }
      try {
        const test = (await serverConnector.readTest(
          { id: testId },
          {
            scope: scope
          }
        )) as ReadOneTest<Scope>
        setTestPair((oldPair) =>
          oldPair.testId === testId
            ? {
                ...oldPair,
                test: test
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить тест с идентификатором ${testId}`
          )
        }
      }
    },
    [scope, testId, setTestPair, notifier]
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
    detectedObjects: [testId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    if (testId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'TEST',
        resourceConfig: {
          id: testId
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
  }, [scope, testId, load])
}

/** Subscribe to test updates for existing test state */
export function useTestSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  testId: number | null,
  setTest: React.Dispatch<React.SetStateAction<ReadOneTest<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [testPair, setTestPair] = React.useState<{
    testId: number | null
    test?: ReadOneTest<Scope> | null
  }>({
    testId: testId,
    test: undefined
  })
  React.useEffect(() => {
    setTestPair((oldPair) => ({
      testId: testId,
      test: oldPair.test
    }))
  }, [testId, setTestPair])
  useTestSubscriptionInner(
    scope,
    testPair.testId,
    setTestPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (testPair.test !== undefined) {
      setTest(testPair.test)
    }
  }, [setTest, testPair.test])
}

/** Subscribe to test updates with initial load */
export function useTest<Scope extends ReadOneResourceScope>(
  scope: Scope,
  testId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [testPair, setTestPair] = React.useState<{
    testId: number | null
    test?: ReadOneTest<Scope> | null
  }>({
    testId: testId,
    test: null
  })
  React.useEffect(() => {
    setTestPair((oldPair) => ({
      testId: testId,
      test: oldPair.test
    }))
  }, [testId, setTestPair])
  useTestSubscriptionInner(
    scope,
    testPair.testId,
    setTestPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return testPair.test ?? null
}

/** Subscribe to tests updates for existing tests state */
export function useTestsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setTests:
    | React.Dispatch<React.SetStateAction<ReadManyTest<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyTest<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        const tests = (await serverConnector.readTests({
          scope: scope
        })) as ReadManyTest<Scope>[]
        setTests(tests)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning('не удалось загрузить актуальный список тестов')
        }
      }
    },
    [scope, setTests, notifier]
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
        type: 'TEST'
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

/** Subscribe to tests updates with initial load */
export function useTests<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [tests, setTests] = React.useState<ReadManyTest<Scope>[] | null>(null)
  useTestsSubscription(
    scope,
    setTests,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return tests
}

type ExtraFilter = Omit<TestsFilter, 'testIds'>

function useTestsFilteredSubscriptionInner<Scope extends ReadManyResourceScope>(
  scope: Scope,
  testIds: number[] | null | undefined,
  extraFilter: ExtraFilter | null,
  setTestsPair: React.Dispatch<
    React.SetStateAction<{
      testIds?: number[] | null
      extraFilter: ExtraFilter | null
      tests?: ReadManyTest<Scope>[] | null
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
        const tests =
          testIds !== null
            ? ((await serverConnector.readTests({
                ids: testIds,
                ...extraFilter,
                scope: scope
              })) as ReadManyTest<Scope>[])
            : EMPTY_TESTS_ARR
        setTestsPair((oldPair) =>
          isEqual(oldPair.testIds, testIds) &&
          isEqual(oldPair.extraFilter, extraFilter)
            ? {
                ...oldPair,
                tests: tests
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning('не удалось загрузить актуальный список тестов')
        }
      }
    },
    [scope, testIds, extraFilter, setTestsPair, notifier]
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

  // Process test ids change or extra filter change or active flag change to true
  useChangeDetector({
    detectedObjects: [testIds, extraFilter, active],
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
        type: 'TEST'
      },
      (data) => {
        ;(() => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS') ||
            extraFilter !== null
          ) {
            void load(true)
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [scope, testIds, extraFilter, load])
}

/** Subscribe to tests updates for existing tests state */
export function useTestsFilteredSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  testIds: number[] | null | undefined,
  extraFilter: ExtraFilter | null,
  setTests: React.Dispatch<React.SetStateAction<ReadManyTest<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [testsPair, setTestsPair] = React.useState<{
    testIds?: number[] | null
    extraFilter: ExtraFilter | null
    tests?: ReadManyTest<Scope>[] | null
  }>({
    testIds: testIds,
    extraFilter: extraFilter,
    tests: undefined
  })
  React.useEffect(() => {
    setTestsPair((oldPair) => ({
      testIds: testIds,
      extraFilter: extraFilter,
      tests: oldPair.tests
    }))
  }, [testIds, extraFilter, setTestsPair])
  useTestsFilteredSubscriptionInner(
    scope,
    testsPair.testIds,
    testsPair.extraFilter,
    setTestsPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (testsPair.tests !== undefined) {
      setTests(testsPair.tests)
    }
  }, [setTests, testsPair.tests])
}

/** Subscribe to tests updates with initial load */
export function useTestsFiltered<Scope extends ReadManyResourceScope>(
  scope: Scope,
  testIds: number[] | null | undefined,
  extraFilter: ExtraFilter | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [testsPair, setTestsPair] = React.useState<{
    testIds?: number[] | null
    extraFilter: ExtraFilter | null
    tests?: ReadManyTest<Scope>[] | null
  }>({
    testIds: testIds,
    extraFilter: extraFilter,
    tests: null
  })
  React.useEffect(() => {
    setTestsPair((oldPair) => ({
      testIds: testIds,
      extraFilter: extraFilter,
      tests: oldPair.tests
    }))
  }, [testIds, setTestsPair])
  useTestsFilteredSubscriptionInner(
    scope,
    testsPair.testIds,
    testsPair.extraFilter,
    setTestsPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return testsPair.tests ?? null
}
