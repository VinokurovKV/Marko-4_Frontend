// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadUserWithPrimaryPropsSuccessResultDto,
  ReadUserWithUpToSecondaryPropsSuccessResultDto,
  ReadUserWithUpToTertiaryPropsSuccessResultDto,
  ReadUserWithAllPropsSuccessResultDto,
  ReadUsersWithPrimaryPropsSuccessResultItemDto,
  ReadUsersWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/users.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneUser<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadUserWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadUserWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadUserWithUpToTertiaryPropsSuccessResultDto
        : ReadUserWithAllPropsSuccessResultDto
>

type ReadManyUser<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadUsersWithPrimaryPropsSuccessResultItemDto
    : ReadUsersWithUpToSecondaryPropsSuccessResultItemDto
>

/** Subscribe to user updates for existing user state */
export function useUserSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  userId: number | null,
  setUser: React.Dispatch<React.SetStateAction<ReadOneUser<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (active === false) {
        return
      }
      if (userId === null) {
        setUser(null as ReadOneUser<Scope>)
        return
      }
      try {
        const user = (await serverConnector.readUser(
          { id: userId },
          {
            scope: scope
          }
        )) as ReadOneUser<Scope>
        setUser(user)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить пользователя с идентификатором ${userId}`
          )
        }
      }
    },
    [scope, userId, setUser, active, notifier]
  )

  React.useEffect(() => {
    setInitialized(true)
    if (withInitialLoad === false && initialized === false) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [
    scope,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    initialized,
    setInitialized,
    load
  ])

  // Subscribe
  React.useEffect(() => {
    if (userId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'USER',
        resourceConfig: {
          id: userId
        }
      },
      (data) => {
        ;(() => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope !== 'PRIMARY_PROPS') ||
            (updateScope.tertiaryProps &&
              (scope === 'UP_TO_TERTIARY_PROPS' || scope === 'ALL_PROPS')) ||
            (updateScope.quaternaryProps && scope === 'ALL_PROPS')
          ) {
            void load(true)
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [scope, userId, load])
}

/** Subscribe to user updates with initial load */
export function useUser<Scope extends ReadOneResourceScope>(
  scope: Scope,
  userId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [user, setUser] = React.useState<ReadOneUser<Scope> | null>(null)
  useUserSubscription(
    scope,
    userId,
    setUser,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return user
}

/** Subscribe to users updates for existing users state */
export function useUsersSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setUsers:
    | React.Dispatch<React.SetStateAction<ReadManyUser<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyUser<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        if (active === false) {
          return
        }
        const users = (await serverConnector.readUsers({
          scope: scope
        })) as ReadManyUser<Scope>[]
        setUsers(users)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список пользователей'
          )
        }
      }
    },
    [scope, setUsers, active, notifier]
  )

  // Initial load
  React.useEffect(() => {
    if (withInitialLoad === false) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [scope, withInitialLoad, notifyAboutInitialLoadProblems, load])

  // Subscribe
  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'USER'
      },
      (data) => {
        ;(() => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            void load(true)
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [scope, load])
}

/** Subscribe to users updates with initial load */
export function useUsers<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [users, setUsers] = React.useState<ReadManyUser<Scope>[] | null>(null)
  useUsersSubscription(
    scope,
    setUsers,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return users
}
