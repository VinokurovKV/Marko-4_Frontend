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
import { useChangeDetector } from '../change-detector'
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

function useDeviceSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  deviceId: number | null,
  setDevicePair: React.Dispatch<
    React.SetStateAction<{
      deviceId: number | null
      device?: ReadOneDevice<Scope> | null
    }>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (deviceId === null) {
        setDevicePair((oldPair) =>
          oldPair.deviceId === null ? { ...oldPair, device: null } : oldPair
        )
        return
      }
      try {
        const device = (await serverConnector.readDevice(
          { id: deviceId },
          {
            scope: scope
          }
        )) as ReadOneDevice<Scope>
        setDevicePair((oldPair) =>
          oldPair.deviceId === deviceId
            ? {
                ...oldPair,
                device: device
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить устройство с идентификатором ${deviceId}`
          )
        }
      }
    },
    [scope, deviceId, setDevicePair, notifier]
  )

  // Initial load
  React.useEffect(() => {
    setInitialized(true)
    if (active === false || withInitialLoad === false || initialized) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [
    scope,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active,
    initialized,
    setInitialized,
    load
  ])

  // Process resource id change or active flag change to true
  useChangeDetector({
    detectedObjects: [deviceId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

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

/** Subscribe to device updates for existing device state */
export function useDeviceSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  deviceId: number | null,
  setDevice: React.Dispatch<React.SetStateAction<ReadOneDevice<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [devicePair, setDevicePair] = React.useState<{
    deviceId: number | null
    device?: ReadOneDevice<Scope> | null
  }>({
    deviceId: deviceId,
    device: undefined
  })
  React.useEffect(() => {
    setDevicePair((oldPair) => ({
      deviceId: deviceId,
      device: oldPair.device
    }))
  }, [deviceId, setDevicePair])
  useDeviceSubscriptionInner(
    scope,
    devicePair.deviceId,
    setDevicePair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (devicePair.device !== undefined) {
      setDevice(devicePair.device)
    }
  }, [setDevice, devicePair.device])
}

/** Subscribe to device updates with initial load */
export function useDevice<Scope extends ReadOneResourceScope>(
  scope: Scope,
  deviceId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [devicePair, setDevicePair] = React.useState<{
    deviceId: number | null
    device?: ReadOneDevice<Scope> | null
  }>({
    deviceId: deviceId,
    device: null
  })
  React.useEffect(() => {
    setDevicePair((oldPair) => ({
      deviceId: deviceId,
      device: oldPair.device
    }))
  }, [deviceId, setDevicePair])
  useDeviceSubscriptionInner(
    scope,
    devicePair.deviceId,
    setDevicePair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return devicePair.device ?? null
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

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
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
    [scope, setDevices, notifier]
  )

  // Initial load
  React.useEffect(() => {
    setInitialized(true)
    if (active === false || withInitialLoad === false || initialized) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [
    scope,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active,
    initialized,
    setInitialized,
    load
  ])

  // Process active flag change to true
  useChangeDetector({
    detectedObjects: [active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

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
