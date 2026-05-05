// Project
import type { UserPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readUserPrimary, readAction } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useUserSubscription } from '~/hooks/resources'
import { ActionViewer } from '~/components/single-viewers/action'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/action'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const actionId = (() => {
    const parsed = parseInt(params.actionId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [action] = await Promise.all([readAction(actionId)])
  const [user] = await Promise.all([
    readUserPrimary(action?.initiatorId ?? null)
  ])
  return {
    actionId,
    action,
    user
  }
}

function ActionRouteInner({
  loaderData: { actionId, action, user: initialUser }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [user, setUser] = React.useState<UserPrimary | null>(initialUser)

  useUserSubscription('PRIMARY_PROPS', action?.initiatorId ?? null, setUser)

  React.useEffect(() => {
    if (actionId === null) {
      notifier.showError('указан некорректный идентификатор действия в URL')
    } else if (
      action === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_ACTION')
    ) {
      notifier.showError(
        `не удалось загрузить действие с идентификатором ${actionId}`
      )
    }
  }, [actionId, action, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_ACTION') === false ? (
    <ForbiddenScreen />
  ) : actionId !== null && action !== null ? (
    <ActionViewer key={actionId} action={action} initiator={user} />
  ) : null
}

export default function ActionRoute(props: Route.ComponentProps) {
  return <ActionRouteInner key={props.loaderData.actionId} {...props} />
}
