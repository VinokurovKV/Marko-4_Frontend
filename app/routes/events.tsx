// Project
import type { RolePrimary, SystemEvent, UserSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readEvents, readRolesPrimary, readUsersSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { EventsScreen } from '~/components/screens/events'
// React router
import type { Route } from './+types/events'
// React
import * as React from 'react'

const DEFAULT_EVENTS_TAKE = 1000

async function readLatestEvents() {
  return await serverConnector.readEvents({
    sortOrder: 'NEW_TO_OLD',
    take: DEFAULT_EVENTS_TAKE
  })
}

export async function clientLoader() {
  await serverConnector.connect()
  const [events, users, roles] = await Promise.all([
    readEvents(),
    readUsersSecondary(),
    readRolesPrimary()
  ])
  return {
    events,
    users,
    roles
  }
}

export default function EventsRoute({
  loaderData: {
    events: initialEvents,
    users: initialUsers,
    roles: initialRoles
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const canReadEvents =
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_EVENT')

  const [events, setEvents] = React.useState<SystemEvent[] | null>(
    initialEvents
  )
  const [users, setUsers] = React.useState<UserSecondary[] | null>(initialUsers)
  const [roles, setRoles] = React.useState<RolePrimary[] | null>(initialRoles)

  const reloadEvents = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        const nextEvents = await readLatestEvents()
        setEvents(nextEvents)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning('не удалось загрузить актуальный список событий')
        }
      }
    },
    [notifier]
  )

  const reloadUsersAndRoles = React.useCallback(async () => {
    const [nextUsers, nextRoles] = await Promise.all([
      readUsersSecondary(),
      readRolesPrimary()
    ])
    setUsers(nextUsers)
    setRoles(nextRoles)
  }, [])

  React.useEffect(() => {
    if (!canReadEvents) {
      return
    }
    const subscriptionId = serverConnector.subscribeToEvents({}, () => {
      void reloadEvents(false)
      void reloadUsersAndRoles()
    }).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [canReadEvents, reloadEvents])

  React.useEffect(() => {
    if (events === null && canReadEvents) {
      notifier.showError('не удалось загрузить список событий')
    }
  }, [events, canReadEvents, notifier])

  return canReadEvents === false ? (
    <ForbiddenScreen />
  ) : events !== null ? (
    <EventsScreen events={events} users={users} roles={roles} />
  ) : null
}
