// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadTestWithPrimaryPropsSuccessResultDto,
  ReadTestWithUpToSecondaryPropsSuccessResultDto,
  ReadTestWithUpToTertiaryPropsSuccessResultDto,
  ReadTestWithAllPropsSuccessResultDto,
  ReadTestsWithPrimaryPropsSuccessResultItemDto,
  ReadTestsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/tests.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneTest<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadTestWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadTestWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadTestWithUpToTertiaryPropsSuccessResultDto
        : ReadTestWithAllPropsSuccessResultDto
>

type ReadManyTest<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadTestsWithPrimaryPropsSuccessResultItemDto
    : ReadTestsWithUpToSecondaryPropsSuccessResultItemDto
>

/** Subscribe to test updates for existing test state */
export function useTestSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  testId: number | null,
  setTest:
    | React.Dispatch<React.SetStateAction<ReadOneTest<Scope>>>
    | React.Dispatch<React.SetStateAction<ReadOneTest<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (testId === null || active === false) {
        return
      }
      try {
        const test = (await serverConnector.readTest(
          { id: testId },
          {
            scope: scope
          }
        )) as ReadOneTest<Scope>
        setTest(test)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить тест с идентификатором ${testId}`
          )
        }
      }
    },
    [scope, testId, setTest, active]
  )

  // Initial load
  React.useEffect(() => {
    if (withInitialLoad === false) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [scope, withInitialLoad, notifyAboutInitialLoadProblems, load])

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

/** Subscribe to test updates with initial load */
export function useTest<Scope extends ReadOneResourceScope>(
  scope: Scope,
  testId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [test, setTest] = React.useState<ReadOneTest<Scope> | null>(null)
  useTestSubscription(
    scope,
    testId,
    setTest,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return test
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

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        if (active === false) {
          return
        }
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
    [scope, setTests, active]
  )

  // Initial load
  React.useEffect(() => {
    if (withInitialLoad === false) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [scope, withInitialLoad, notifyAboutInitialLoadProblems, load])

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
