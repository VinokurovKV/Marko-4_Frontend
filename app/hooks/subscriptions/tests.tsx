// Project
import type { ReadManyResourceScope } from '@common/enums'
import type {
  ReadTestsWithPrimaryPropsSuccessResultItemDto,
  ReadTestsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/tests.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadManyTest<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadTestsWithPrimaryPropsSuccessResultItemDto
    : ReadTestsWithUpToSecondaryPropsSuccessResultItemDto
>

export function useTestsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setTests:
    | React.Dispatch<React.SetStateAction<ReadManyTest<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyTest<Scope>[] | null>>
) {
  const notifier = useNotifier()

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'TEST'
      },
      (data) => {
        void (async () => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            try {
              const tests = (await serverConnector.readTests({
                scope: scope
              })) as ReadManyTest<Scope>[]
              setTests(tests)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список тестов'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setTests])
}
