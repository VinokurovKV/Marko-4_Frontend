// Project
import type { ReadManyResourceScope } from '@common/enums'
import type {
  ReadFragmentsWithPrimaryPropsSuccessResultItemDto,
  ReadFragmentsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/fragments.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadManyFragment<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadFragmentsWithPrimaryPropsSuccessResultItemDto
    : ReadFragmentsWithUpToSecondaryPropsSuccessResultItemDto
>

export function useFragmentsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setFragments:
    | React.Dispatch<React.SetStateAction<ReadManyFragment<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyFragment<Scope>[] | null>>
) {
  const notifier = useNotifier()

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'FRAGMENT'
      },
      (data) => {
        void (async () => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            try {
              const fragments = (await serverConnector.readFragments({
                scope: scope
              })) as ReadManyFragment<Scope>[]
              setFragments(fragments)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список фрагментов документов'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setFragments])
}
