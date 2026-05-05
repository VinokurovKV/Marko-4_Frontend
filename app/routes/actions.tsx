// Project
import type { UserPrimary, ActionInfo } from '~/types'
import { serverConnector } from '~/server-connector'
import { readActionInfos, readUsersPrimary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useUsersSubscription } from '~/hooks/resources'
import { useActionsSubscription } from '~/hooks/actions'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { ActionsScreen } from '~/components/screens/actions'
// React router
import type { Route } from './+types/actions'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [actions, users] = await Promise.all([
    readActionInfos(),
    readUsersPrimary()
  ])
  return {
    actions,
    users
  }
}

export default function ActionsRoute({
  loaderData: { actions: initialActions, users: initialUsers }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [users, setUsers] = React.useState<UserPrimary[] | null>(initialUsers)
  const [actions, setActions] = React.useState<ActionInfo[] | null>(
    initialActions
  )

  useUsersSubscription('PRIMARY_PROPS', setUsers)
  useActionsSubscription(setActions)

  React.useEffect(() => {
    if (
      actions === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_ACTION')
    ) {
      notifier.showError('не удалось загрузить список действий')
    }
  }, [actions, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_ACTION') === false ? (
    <ForbiddenScreen />
  ) : actions !== null ? (
    <ActionsScreen actions={actions} users={users}>
      {outlet !== null ? outlet : null}
    </ActionsScreen>
  ) : null
}
