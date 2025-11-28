// Project
import type { ReadManyResourceScope } from '@common/enums'
import type {
  ReadCoveragesWithPrimaryPropsSuccessResultItemDto,
  ReadCoveragesWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/coverages.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadManyCoverage<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadCoveragesWithPrimaryPropsSuccessResultItemDto
    : ReadCoveragesWithUpToSecondaryPropsSuccessResultItemDto
>

export function useCoveragesSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setCoverages:
    | React.Dispatch<React.SetStateAction<ReadManyCoverage<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyCoverage<Scope>[] | null>>
) {
  const notifier = useNotifier()

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'COVERAGE'
      },
      (data) => {
        void (async () => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            try {
              const coverages = (await serverConnector.readCoverages({
                scope: scope
              })) as ReadManyCoverage<Scope>[]
              setCoverages(coverages)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список покрытий требований'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setCoverages])
}
