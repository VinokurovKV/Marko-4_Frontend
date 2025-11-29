// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadRoleWithPrimaryPropsSuccessResultDto,
  ReadRoleWithUpToSecondaryPropsSuccessResultDto,
  ReadRoleWithUpToTertiaryPropsSuccessResultDto,
  ReadRoleWithAllPropsSuccessResultDto,
  ReadRolesWithPrimaryPropsSuccessResultItemDto,
  ReadRolesWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/roles.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneRole<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadRoleWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadRoleWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadRoleWithUpToTertiaryPropsSuccessResultDto
        : ReadRoleWithAllPropsSuccessResultDto
>

type ReadManyRole<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadRolesWithPrimaryPropsSuccessResultItemDto
    : ReadRolesWithUpToSecondaryPropsSuccessResultItemDto
>

/** Subscribe to role updates for existing role state */
export function useRoleSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  roleId: number | null,
  setRole:
    | React.Dispatch<React.SetStateAction<ReadOneRole<Scope>>>
    | React.Dispatch<React.SetStateAction<ReadOneRole<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (roleId === null || active === false) {
        return
      }
      try {
        const role = (await serverConnector.readRole(
          { id: roleId },
          {
            scope: scope
          }
        )) as ReadOneRole<Scope>
        setRole(role)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить роль с идентификатором ${roleId}`
          )
        }
      }
    },
    [scope, roleId, setRole, active]
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

/** Subscribe to role updates with initial load */
export function useRole<Scope extends ReadOneResourceScope>(
  scope: Scope,
  roleId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [role, setRole] = React.useState<ReadOneRole<Scope> | null>(null)
  useRoleSubscription(
    scope,
    roleId,
    setRole,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return role
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

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        if (active === false) {
          return
        }
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
    [scope, setRoles, active]
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
