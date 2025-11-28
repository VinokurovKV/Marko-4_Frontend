// Project
import type { ReadManyResourceScope } from '@common/enums'
import type {
  ReadRequirementsWithPrimaryPropsSuccessResultItemDto,
  ReadRequirementsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/requirements.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadManyRequirement<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadRequirementsWithPrimaryPropsSuccessResultItemDto
    : ReadRequirementsWithUpToSecondaryPropsSuccessResultItemDto
>

export function useRequirementsSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  setRequirements:
    | React.Dispatch<React.SetStateAction<ReadManyRequirement<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyRequirement<Scope>[] | null>>
) {
  const notifier = useNotifier()

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'REQUIREMENT'
      },
      (data) => {
        void (async () => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            try {
              const requirements = (await serverConnector.readRequirements({
                scope: scope
              })) as ReadManyRequirement<Scope>[]
              setRequirements(requirements)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список требований'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setRequirements])
}
