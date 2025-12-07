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
import { useChangeDetector } from '../change-detector'
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
  setUserPair: React.Dispatch<
    React.SetStateAction<{
      userId: number | null
      user: ReadOneUser<Scope> | null
    }>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (userId === null) {
        setUserPair((oldPair) =>
          oldPair.userId === null ? { ...oldPair, user: null } : oldPair
        )
        return
      }
      try {
        const user = (await serverConnector.readUser(
          { id: userId },
          {
            scope: scope
          }
        )) as ReadOneUser<Scope>
        setUserPair((oldPair) =>
          oldPair.userId === userId
            ? {
                ...oldPair,
                user: user
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить пользователя с идентификатором ${userId}`
          )
        }
      }
    },
    [scope, userId, setUserPair, notifier]
  )

  // Initial load
  React.useEffect(() => {
    setInitialized(true)
    if (active === false || withInitialLoad === false || initialized) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [
    scope,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active,
    initialized,
    setInitialized,
    load
  ])

  // Process resource id change or active flag change to true
  useChangeDetector({
    detectedObjects: [userId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

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
  const [userPair, setUserPair] = React.useState<{
    userId: number | null
    user: ReadOneUser<Scope> | null
  }>({
    userId: null,
    user: null
  })
  React.useEffect(() => {
    setUserPair((oldPair) => ({
      userId: userId,
      user: oldPair.user
    }))
  }, [userId, setUserPair])
  useUserSubscription(
    scope,
    userPair.userId,
    setUserPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return userPair.user
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

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
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
    [scope, setUsers, notifier]
  )

  // Initial load
  React.useEffect(() => {
    setInitialized(true)
    if (active === false || withInitialLoad === false || initialized) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [
    scope,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active,
    initialized,
    setInitialized,
    load
  ])

  // Process active flag change to true
  useChangeDetector({
    detectedObjects: [active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

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
