// Project
import type { ReadManyResourceScope } from '@common/enums'
import type {
  ReadDevicesWithPrimaryPropsSuccessResultItemDto,
  ReadDevicesWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/devices.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadManyDevice<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadDevicesWithPrimaryPropsSuccessResultItemDto
    : ReadDevicesWithUpToSecondaryPropsSuccessResultItemDto
>

export function useDevicesSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setDevices:
    | React.Dispatch<React.SetStateAction<ReadManyDevice<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyDevice<Scope>[] | null>>
) {
  const notifier = useNotifier()

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'DEVICE'
      },
      (data) => {
        void (async () => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            try {
              const devices = (await serverConnector.readDevices({
                scope: scope
              })) as ReadManyDevice<Scope>[]
              setDevices(devices)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список устройств'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setDevices])
}
