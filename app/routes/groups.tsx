// Project
import type { GroupSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readGroupsSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useGroupsSubscription } from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { GroupsScreen } from '~/components/screens/groups'
import { useOutlet } from 'react-router'
// React router
import type { Route } from './+types/groups'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [groups] = await Promise.all([readGroupsSecondary()])
  return {
    groups
  }
}

export default function GroupsRoute({
  loaderData: { groups: initialGroups }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [groups, setGroups] = React.useState<GroupSecondary[] | null>(
    initialGroups
  )

  useGroupsSubscription('UP_TO_SECONDARY_PROPS', setGroups)

  React.useEffect(() => {
    if (
      groups === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_GROUP')
    ) {
      notifier.showError('не удалось загрузить список групп тестов')
    }
  }, [groups, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP') === false ? (
    <ForbiddenScreen />
  ) : groups !== null ? (
    <GroupsScreen groups={groups}>
      {outlet !== null ? outlet : null}
    </GroupsScreen>
  ) : null
}
