// Project
import type { TagPrimary, DeviceTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readTagsPrimaryFiltered, readDeviceTertiary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useDeviceSubscription
} from '~/hooks/resources'
import { DeviceViewer } from '~/components/single-resource-viewers/resources/device'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/device'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const deviceId = (() => {
    const parsed = parseInt(params.deviceId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [device] = await Promise.all([readDeviceTertiary(deviceId)])
  const [tags] = await Promise.all([
    readTagsPrimaryFiltered(device?.tagIds ?? null)
  ])
  return {
    deviceId,
    tags,
    device
  }
}

function DeviceRouteInner({
  loaderData: { deviceId, tags: initialTags, device: initialDevice }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [tags, setTags] = React.useState<TagPrimary[] | null>(initialTags)
  const [device, setDevice] = React.useState<DeviceTertiary | null>(
    initialDevice
  )

  const tagIds = React.useMemo(() => device?.tagIds ?? null, [device])

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useDeviceSubscription('UP_TO_TERTIARY_PROPS', deviceId, setDevice)

  React.useEffect(() => {
    if (deviceId === null) {
      notifier.showError('указан некорректный идентификатор устройства в URL')
    } else if (
      device === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_DEVICE')
    ) {
      notifier.showError(
        `не удалось загрузить устройство с идентификатором ${deviceId}`
      )
    }
  }, [deviceId, device, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DEVICE') === false ? (
    <ForbiddenScreen />
  ) : deviceId !== null && device !== null ? (
    <DeviceViewer key={deviceId} tags={tags} device={device} />
  ) : null
}

export default function DeviceRoute(props: Route.ComponentProps) {
  return <DeviceRouteInner key={props.loaderData.deviceId} {...props} />
}
