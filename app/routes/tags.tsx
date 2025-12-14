// Project
import type { TagSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readTagsSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useTagsSubscription } from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TagsScreen } from '~/components/screens/tags'
// React router
import type { Route } from './+types/tags'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [tags] = await Promise.all([readTagsSecondary()])
  return {
    tags
  }
}

export default function TagsRoute({
  loaderData: { tags: initialTags }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [tags, setTags] = React.useState<TagSecondary[] | null>(initialTags)

  useTagsSubscription('UP_TO_SECONDARY_PROPS', setTags)

  React.useEffect(() => {
    if (
      tags === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TAG')
    ) {
      notifier.showError('не удалось загрузить список тегов')
    }
  }, [tags, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TAG') === false ? (
    <ForbiddenScreen />
  ) : tags !== null ? (
    <TagsScreen tags={tags}>{outlet !== null ? outlet : null}</TagsScreen>
  ) : null
}
