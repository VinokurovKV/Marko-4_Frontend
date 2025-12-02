// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadDeviceWithPrimaryPropsSuccessResultDto,
  ReadDeviceWithUpToSecondaryPropsSuccessResultDto,
  ReadDeviceWithUpToTertiaryPropsSuccessResultDto,
  ReadDeviceWithAllPropsSuccessResultDto,
  ReadDevicesWithPrimaryPropsSuccessResultItemDto,
  ReadDevicesWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/devices.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneDevice<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadDeviceWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadDeviceWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadDeviceWithUpToTertiaryPropsSuccessResultDto
        : ReadDeviceWithAllPropsSuccessResultDto
>

type ReadManyDevice<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadDevicesWithPrimaryPropsSuccessResultItemDto
    : ReadDevicesWithUpToSecondaryPropsSuccessResultItemDto
>

/** Subscribe to device updates for existing device state */
export function useDeviceSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  deviceId: number | null,
  setDevice: React.Dispatch<React.SetStateAction<ReadOneDevice<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (active === false) {
        return
      }
      if (deviceId === null) {
        setDevice(null as ReadOneDevice<Scope>)
        return
      }
      try {
        const device = (await serverConnector.readDevice(
          { id: deviceId },
          {
            scope: scope
          }
        )) as ReadOneDevice<Scope>
        setDevice(device)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить устройство с идентификатором ${deviceId}`
          )
        }
      }
    },
    [scope, deviceId, setDevice, active, notifier]
  )

  React.useEffect(() => {
    setInitialized(true)
    if (withInitialLoad === false && initialized === false) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [
    scope,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    initialized,
    setInitialized,
    load
  ])

  // Subscribe
  React.useEffect(() => {
    if (deviceId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'DEVICE',
        resourceConfig: {
          id: deviceId
        }
      },
      (data) => {
        ;(() => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope !== 'PRIMARY_PROPS') ||
            (updateScope.tertiaryProps &&
              (scope === 'UP_TO_TERTIARY_PROPS' || scope === 'ALL_PROPS')) ||
            (updateScope.quaternaryProps && scope === 'ALL_PROPS')
          ) {
            void load(true)
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [scope, deviceId, load])
}

/** Subscribe to device updates with initial load */
export function useDevice<Scope extends ReadOneResourceScope>(
  scope: Scope,
  deviceId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [device, setDevice] = React.useState<ReadOneDevice<Scope> | null>(null)
  useDeviceSubscription(
    scope,
    deviceId,
    setDevice,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return device
}

/** Subscribe to devices updates for existing devices state */
export function useDevicesSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setDevices:
    | React.Dispatch<React.SetStateAction<ReadManyDevice<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyDevice<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        if (active === false) {
          return
        }
        const devices = (await serverConnector.readDevices({
          scope: scope
        })) as ReadManyDevice<Scope>[]
        setDevices(devices)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список устройств'
          )
        }
      }
    },
    [scope, setDevices, active, notifier]
  )

  // Initial load
  React.useEffect(() => {
    if (withInitialLoad === false) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [scope, withInitialLoad, notifyAboutInitialLoadProblems, load])

  // Subscribe
  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'DEVICE'
      },
      (data) => {
        ;(() => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            void load(true)
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [scope, load])
}

/** Subscribe to devices updates with initial load */
export function useDevices<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [devices, setDevices] = React.useState<ReadManyDevice<Scope>[] | null>(
    null
  )
  useDevicesSubscription(
    scope,
    setDevices,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return devices
}
