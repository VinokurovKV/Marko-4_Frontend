// Project
import type { ReadManyResourceScope } from '@common/enums'
import type {
  ReadTestTemplatesWithPrimaryPropsSuccessResultItemDto,
  ReadTestTemplatesWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/test-templates.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadManyTestTemplate<Scope extends ReadManyResourceScope> =
  DtoWithoutEnums<
    Scope extends 'PRIMARY_PROPS'
      ? ReadTestTemplatesWithPrimaryPropsSuccessResultItemDto
      : ReadTestTemplatesWithUpToSecondaryPropsSuccessResultItemDto
  >

export function useTestTemplatesSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  setTestTemplates:
    | React.Dispatch<React.SetStateAction<ReadManyTestTemplate<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyTestTemplate<Scope>[] | null>>
) {
  const notifier = useNotifier()

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'TEST_TEMPLATE'
      },
      (data) => {
        void (async () => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            try {
              const testTemplates = (await serverConnector.readTestTemplates({
                scope: scope
              })) as ReadManyTestTemplate<Scope>[]
              setTestTemplates(testTemplates)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список шаблонов тестов'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setTestTemplates])
}
