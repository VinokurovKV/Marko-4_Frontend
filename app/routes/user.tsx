// Project
import type { RolePrimary, UserTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readRolePrimary, readUserTertiary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useRoleSubscription, useUserSubscription } from '~/hooks/resources'
import { UserViewer } from '~/components/single-resource-viewers/resources/user'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/user'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const userId = (() => {
    const parsed = parseInt(params.userId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [user] = await Promise.all([readUserTertiary(userId)])
  const [role] = await Promise.all([readRolePrimary(user?.roleId ?? null)])
  return {
    userId,
    role,
    user
  }
}

function UserRouteInner({
  loaderData: { userId, role: initialRole, user: initialUser }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [role, setRole] = React.useState<RolePrimary | null>(initialRole)
  const [user, setUser] = React.useState<UserTertiary | null>(initialUser)

  useRoleSubscription('PRIMARY_PROPS', user?.roleId ?? null, setRole)
  useUserSubscription('UP_TO_TERTIARY_PROPS', userId, setUser)

  React.useEffect(() => {
    if (userId === null) {
      notifier.showError('указан некорректный идентификатор пользователя в URL')
    } else if (
      user === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_USER')
    ) {
      notifier.showError(
        `не удалось загрузить пользователя с идентификатором ${userId}`
      )
    }
  }, [userId, user, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_USER') === false ? (
    <ForbiddenScreen />
  ) : userId !== null && user !== null ? (
    <UserViewer key={userId} role={role} user={user} />
  ) : null
}

export default function UserRoute(props: Route.ComponentProps) {
  return <UserRouteInner key={props.loaderData.userId} {...props} />
}
