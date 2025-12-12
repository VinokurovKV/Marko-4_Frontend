// Project
import type { DeviceSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readDevicesSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useDevicesSubscription } from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { DevicesScreen } from '~/components/screens/devices'
// React router
import type { Route } from './+types/devices'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [devices] = await Promise.all([readDevicesSecondary()])
  return {
    devices
  }
}

export default function DevicesRoute({
  loaderData: { devices: initialDevices }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [devices, setDevices] = React.useState<DeviceSecondary[] | null>(
    initialDevices
  )

  useDevicesSubscription('UP_TO_SECONDARY_PROPS', setDevices)

  React.useEffect(() => {
    if (
      devices === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_DEVICE')
    ) {
      notifier.showError('не удалось загрузить список устройств')
    }
  }, [devices, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DEVICE') === false ? (
    <ForbiddenScreen />
  ) : devices !== null ? (
    <DevicesScreen devices={devices} />
  ) : null
}
