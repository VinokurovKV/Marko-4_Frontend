// Project
import type { ReadManyResourceScope } from '@common/enums'
import type {
  ReadUsersWithPrimaryPropsSuccessResultItemDto,
  ReadUsersWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/users.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadManyUser<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadUsersWithPrimaryPropsSuccessResultItemDto
    : ReadUsersWithUpToSecondaryPropsSuccessResultItemDto
>

export function useUsersSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setUsers:
    | React.Dispatch<React.SetStateAction<ReadManyUser<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyUser<Scope>[] | null>>
) {
  const notifier = useNotifier()

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'USER'
      },
      (data) => {
        void (async () => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            try {
              const users = (await serverConnector.readUsers({
                scope: scope
              })) as ReadManyUser<Scope>[]
              setUsers(users)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список пользователей'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setUsers])
}
