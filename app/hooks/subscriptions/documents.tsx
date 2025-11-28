// Project
import type { ReadManyResourceScope } from '@common/enums'
import type {
  ReadDocumentsWithPrimaryPropsSuccessResultItemDto,
  ReadDocumentsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/documents.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadManyDocument<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadDocumentsWithPrimaryPropsSuccessResultItemDto
    : ReadDocumentsWithUpToSecondaryPropsSuccessResultItemDto
>

export function useDocumentsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setDocuments:
    | React.Dispatch<React.SetStateAction<ReadManyDocument<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyDocument<Scope>[] | null>>
) {
  const notifier = useNotifier()

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'DOCUMENT'
      },
      (data) => {
        void (async () => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            try {
              const documents = (await serverConnector.readDocuments({
                scope: scope
              })) as ReadManyDocument<Scope>[]
              setDocuments(documents)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список документов'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setDocuments])
}
