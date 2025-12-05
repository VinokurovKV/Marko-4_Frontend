// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadGroupWithPrimaryPropsSuccessResultDto,
  ReadGroupWithUpToSecondaryPropsSuccessResultDto,
  ReadGroupWithUpToTertiaryPropsSuccessResultDto,
  ReadGroupWithAllPropsSuccessResultDto,
  ReadGroupsWithPrimaryPropsSuccessResultItemDto,
  ReadGroupsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/groups.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneGroup<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadGroupWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadGroupWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadGroupWithUpToTertiaryPropsSuccessResultDto
        : ReadGroupWithAllPropsSuccessResultDto
>

type ReadManyGroup<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadGroupsWithPrimaryPropsSuccessResultItemDto
    : ReadGroupsWithUpToSecondaryPropsSuccessResultItemDto
>

/** Subscribe to group updates for existing group state */
export function useGroupSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  groupId: number | null,
  setGroup: React.Dispatch<React.SetStateAction<ReadOneGroup<Scope> | null>>,
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
      if (groupId === null) {
        setGroup(null as ReadOneGroup<Scope>)
        return
      }
      try {
        const group = (await serverConnector.readGroup(
          { id: groupId },
          {
            scope: scope
          }
        )) as ReadOneGroup<Scope>
        setGroup(group)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить группу тестов с идентификатором ${groupId}`
          )
        }
      }
    },
    [scope, groupId, setGroup, active, notifier]
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
    if (groupId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'GROUP',
        resourceConfig: {
          id: groupId
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
  }, [scope, groupId, load])
}

/** Subscribe to group updates with initial load */
export function useGroup<Scope extends ReadOneResourceScope>(
  scope: Scope,
  groupId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [group, setGroup] = React.useState<ReadOneGroup<Scope> | null>(null)
  useGroupSubscription(
    scope,
    groupId,
    setGroup,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return group
}

/** Subscribe to groups updates for existing groups state */
export function useGroupsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setGroups:
    | React.Dispatch<React.SetStateAction<ReadManyGroup<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyGroup<Scope>[] | null>>,
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
        const groups = (await serverConnector.readGroups({
          scope: scope
        })) as ReadManyGroup<Scope>[]
        setGroups(groups)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список групп тестов'
          )
        }
      }
    },
    [scope, setGroups, active, notifier]
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
        type: 'GROUP'
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

/** Subscribe to groups updates with initial load */
export function useGroups<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [groups, setGroups] = React.useState<ReadManyGroup<Scope>[] | null>(
    null
  )
  useGroupsSubscription(
    scope,
    setGroups,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return groups
}
