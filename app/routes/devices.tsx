// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { DevicesScreen } from '~/components/screens/devices'
// React router
import type { Route } from './+types/devices'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [tags, devices] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null, null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_TAG')
          ? serverConnector
              .readTags({
                scope: 'PRIMARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null),
        rights.includes('READ_DEVICE')
          ? serverConnector
              .readDevices({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    tags,
    devices
  }
}

export default function MetaRoute({
  loaderData: { tags, devices }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (
      devices === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_DEVICE')
    ) {
      notifier.showError('не удалось загрузить список устройств')
    }
  }, [devices])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DEVICE') === false ? (
    <ForbiddenScreen />
  ) : (
    <DevicesScreen initialTags={tags} initialDevices={devices ?? []} />
  )
}
