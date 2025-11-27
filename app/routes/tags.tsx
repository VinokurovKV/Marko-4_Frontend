// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TagsScreen } from '~/components/screens/tags'
// React router
import type { Route } from './+types/tags'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [tags] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null, null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_TAG')
          ? serverConnector
              .readTags({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    tags
  }
}

export default function MetaRoute({
  loaderData: { tags }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (
      tags === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TAG')
    ) {
      notifier.showError('не удалось загрузить список тегов')
    }
  }, [tags])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TAG') === false ? (
    <ForbiddenScreen />
  ) : (
    <TagsScreen initialTags={tags ?? []} />
  )
}
