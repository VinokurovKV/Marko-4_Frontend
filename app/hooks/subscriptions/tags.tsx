// Project
import type { ReadManyResourceScope } from '@common/enums'
import type {
  ReadTagsWithPrimaryPropsSuccessResultItemDto,
  ReadTagsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/tags.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadManyTag<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadTagsWithPrimaryPropsSuccessResultItemDto
    : ReadTagsWithUpToSecondaryPropsSuccessResultItemDto
>

export function useTagsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setTags:
    | React.Dispatch<React.SetStateAction<ReadManyTag<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyTag<Scope>[] | null>>
) {
  const notifier = useNotifier()

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'TAG'
      },
      (data) => {
        void (async () => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            try {
              const tags = (await serverConnector.readTags({
                scope: scope
              })) as ReadManyTag<Scope>[]
              setTags(tags)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список тегов'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setTags])
}
