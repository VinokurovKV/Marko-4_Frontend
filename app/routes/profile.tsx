// Project
import type { RolePrimary, UserTertiary } from '~/types'
import { readRolePrimary } from '~/readers'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useRoleSubscription, useUserSubscription } from '~/hooks/resources'
import { ProfileScreen } from '~/components/screens/profile'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/profile'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()

  if (serverConnector.meta.status !== 'AUTHENTICATED') {
    return {
      userId: null,
      role: null,
      user: null
    }
  }

  const { id, rights } = serverConnector.meta.selfMeta
  const rightsSet = new Set(rights)
  const canReadProfile =
    rightsSet.has('READ_SELF') || rightsSet.has('READ_USER')
  const canReadRole = rightsSet.has('READ_ROLE')

  const user = canReadProfile
    ? ((await serverConnector
        .readUser(
          { id },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)) ?? null)
    : null
  const role = canReadRole ? await readRolePrimary(user?.roleId ?? null) : null

  return {
    userId: id,
    role,
    user
  }
}

function ProfileRouteInner({
  loaderData: { userId, role: initialRole, user: initialUser }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const rightsSet = React.useMemo(
    () =>
      meta.status === 'AUTHENTICATED' ? meta.selfMeta.rightsSet : new Set([]),
    [meta]
  )

  const canReadProfile =
    rightsSet.has('READ_SELF') || rightsSet.has('READ_USER')
  const canReadRole = rightsSet.has('READ_ROLE')
  const canEditProfile =
    rightsSet.has('UPDATE_SELF') || rightsSet.has('UPDATE_USER')
  const canChangePassword =
    rightsSet.has('UPDATE_SELF_PASS') || rightsSet.has('UPDATE_USER_PASS')

  const [role, setRole] = React.useState<RolePrimary | null>(initialRole)
  const [user, setUser] = React.useState<UserTertiary | null>(initialUser)

  useRoleSubscription(
    'PRIMARY_PROPS',
    user?.roleId ?? null,
    setRole,
    initialRole === null,
    false,
    canReadRole
  )
  useUserSubscription(
    'UP_TO_TERTIARY_PROPS',
    userId,
    setUser,
    initialUser === null,
    false,
    canReadProfile
  )

  React.useEffect(() => {
    if (canReadProfile && userId !== null && user === null) {
      notifier.showError('не удалось загрузить профиль пользователя')
    }
  }, [canReadProfile, userId, user, notifier])

  return canReadProfile || canEditProfile || canChangePassword ? (
    <ProfileScreen userId={userId} role={role} user={user} />
  ) : (
    <ForbiddenScreen />
  )
}

export default function ProfileRoute(props: Route.ComponentProps) {
  return (
    <ProfileRouteInner key={props.loaderData.userId ?? 'profile'} {...props} />
  )
}
