// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type { RolePrimary, RoleSecondary, RoleTertiary, RoleAll } from '~/types'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'
// Other
import { isEqual } from 'lodash'

type ReadOneRole<Scope extends ReadOneResourceScope> =
  Scope extends 'PRIMARY_PROPS'
    ? RolePrimary
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? RoleSecondary
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? RoleTertiary
        : RoleAll

type ReadManyRole<Scope extends ReadManyResourceScope> =
  Scope extends 'PRIMARY_PROPS' ? RolePrimary : RoleSecondary

const EMPTY_ROLES_ARR: RoleAll[] = []

function useRoleSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  roleId: number | null,
  setRolePair: React.Dispatch<
    React.SetStateAction<{
      roleId: number | null
      role?: ReadOneRole<Scope> | null
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
      if (roleId === null) {
        setRolePair((oldPair) =>
          oldPair.roleId === null ? { ...oldPair, role: null } : oldPair
        )
        return
      }
      try {
        const role = (await serverConnector.readRole(
          { id: roleId },
          {
            scope: scope
          }
        )) as ReadOneRole<Scope>
        setRolePair((oldPair) =>
          oldPair.roleId === roleId
            ? {
                ...oldPair,
                role: role
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить роль с идентификатором ${roleId}`
          )
        }
      }
    },
    [scope, roleId, setRolePair, notifier]
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
    detectedObjects: [roleId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    if (roleId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'ROLE',
        resourceConfig: {
          id: roleId
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
  }, [scope, roleId, load])
}

/** Subscribe to role updates for existing role state */
export function useRoleSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  roleId: number | null,
  setRole: React.Dispatch<React.SetStateAction<ReadOneRole<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [rolePair, setRolePair] = React.useState<{
    roleId: number | null
    role?: ReadOneRole<Scope> | null
  }>({
    roleId: roleId,
    role: undefined
  })
  React.useEffect(() => {
    setRolePair((oldPair) => ({
      roleId: roleId,
      role: oldPair.role
    }))
  }, [roleId, setRolePair])
  useRoleSubscriptionInner(
    scope,
    rolePair.roleId,
    setRolePair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (rolePair.role !== undefined) {
      setRole(rolePair.role)
    }
  }, [setRole, rolePair.role])
}

/** Subscribe to role updates with initial load */
export function useRole<Scope extends ReadOneResourceScope>(
  scope: Scope,
  roleId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [rolePair, setRolePair] = React.useState<{
    roleId: number | null
    role?: ReadOneRole<Scope> | null
  }>({
    roleId: roleId,
    role: null
  })
  React.useEffect(() => {
    setRolePair((oldPair) => ({
      roleId: roleId,
      role: oldPair.role
    }))
  }, [roleId, setRolePair])
  useRoleSubscriptionInner(
    scope,
    rolePair.roleId,
    setRolePair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return rolePair.role ?? null
}

/** Subscribe to roles updates for existing roles state */
export function useRolesSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setRoles:
    | React.Dispatch<React.SetStateAction<ReadManyRole<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyRole<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        const roles = (await serverConnector.readRoles({
          scope: scope
        })) as ReadManyRole<Scope>[]
        setRoles(roles)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning('не удалось загрузить актуальный список ролей')
        }
      }
    },
    [scope, setRoles, notifier]
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
        type: 'ROLE'
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

/** Subscribe to roles updates with initial load */
export function useRoles<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [roles, setRoles] = React.useState<ReadManyRole<Scope>[] | null>(null)
  useRolesSubscription(
    scope,
    setRoles,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return roles
}

function useRolesFilteredSubscriptionInner<Scope extends ReadManyResourceScope>(
  scope: Scope,
  roleIds: number[] | null,
  setRolesPair: React.Dispatch<
    React.SetStateAction<{
      roleIds: number[] | null
      roles?: ReadManyRole<Scope>[] | null
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
      try {
        const roles =
          roleIds !== null
            ? ((await serverConnector.readRoles({
                ids: roleIds,
                scope: scope
              })) as ReadManyRole<Scope>[])
            : EMPTY_ROLES_ARR
        setRolesPair((oldPair) =>
          isEqual(oldPair.roleIds, roleIds)
            ? {
                ...oldPair,
                roles: roles
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning('не удалось загрузить актуальный список ролей')
        }
      }
    },
    [scope, roleIds, setRolesPair, notifier]
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

  // Process role ids change or active flag change to true
  useChangeDetector({
    detectedObjects: [roleIds, active],
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
        type: 'ROLE'
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
  }, [scope, roleIds, load])
}

/** Subscribe to roles updates for existing roles state */
export function useRolesFilteredSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  roleIds: number[] | null,
  setRoles: React.Dispatch<React.SetStateAction<ReadManyRole<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [rolesPair, setRolesPair] = React.useState<{
    roleIds: number[] | null
    roles?: ReadManyRole<Scope>[] | null
  }>({
    roleIds: roleIds,
    roles: undefined
  })
  React.useEffect(() => {
    setRolesPair((oldPair) => ({
      roleIds: roleIds,
      roles: oldPair.roles
    }))
  }, [roleIds, setRolesPair])
  useRolesFilteredSubscriptionInner(
    scope,
    rolesPair.roleIds,
    setRolesPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (rolesPair.roles !== undefined) {
      setRoles(rolesPair.roles)
    }
  }, [setRoles, rolesPair.roles])
}

/** Subscribe to roles updates with initial load */
export function useRolesFiltered<Scope extends ReadManyResourceScope>(
  scope: Scope,
  roleIds: number[] | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [rolesPair, setRolesPair] = React.useState<{
    roleIds: number[] | null
    roles?: ReadManyRole<Scope>[] | null
  }>({
    roleIds: roleIds,
    roles: null
  })
  React.useEffect(() => {
    setRolesPair((oldPair) => ({
      roleIds: roleIds,
      roles: oldPair.roles
    }))
  }, [roleIds, setRolesPair])
  useRolesFilteredSubscriptionInner(
    scope,
    rolesPair.roleIds,
    setRolesPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return rolesPair.roles ?? null
}
