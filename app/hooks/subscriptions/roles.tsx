// Project
import type { ReadManyResourceScope } from '@common/enums'
import type {
  ReadRolesWithPrimaryPropsSuccessResultItemDto,
  ReadRolesWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/roles.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadManyRole<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadRolesWithPrimaryPropsSuccessResultItemDto
    : ReadRolesWithUpToSecondaryPropsSuccessResultItemDto
>

export function useRolesSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setRoles:
    | React.Dispatch<React.SetStateAction<ReadManyRole<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyRole<Scope>[] | null>>
) {
  const notifier = useNotifier()

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'ROLE'
      },
      (data) => {
        void (async () => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            try {
              const roles = (await serverConnector.readRoles({
                scope: scope
              })) as ReadManyRole<Scope>[]
              setRoles(roles)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список ролей'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setRoles])
}
