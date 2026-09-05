// Project
import type { SliceSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readSlicesSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { SlicesScreen } from '~/components/screens/slices'
// React router
import type { Route } from './+types/slices'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [slices] = await Promise.all([readSlicesSecondary()])
  return {
    slices
  }
}

export default function SlicesRoute({
  loaderData: { slices: initialSlices }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [slices, setSlices] = React.useState<SliceSecondary[] | null>(
    initialSlices
  )

  const loadSlices = React.useCallback(() => {
    void (async () => {
      const slices = await readSlicesSecondary()
      setSlices(slices)
    })()
  }, [])

  React.useEffect(() => {
    if (
      slices === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_SLICE')
    ) {
      notifier.showError('не удалось загрузить список срезов заданий')
    }
  }, [slices, notifier])

  return meta.status === 'AUTHENTICATED' &&
    (meta.selfMeta.rights.includes('READ_SLICE') === false ||
      meta.selfMeta.rights.includes('READ_TASK') === false) ? (
    <ForbiddenScreen />
  ) : slices !== null ? (
    <SlicesScreen slices={slices} onSlicesChange={loadSlices}>
      {outlet !== null ? outlet : null}
    </SlicesScreen>
  ) : null
}
