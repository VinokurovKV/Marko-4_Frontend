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
import { useChangeDetector } from '../change-detector'
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
  setGroupPair: React.Dispatch<
    React.SetStateAction<{
      groupId: number | null
      group: ReadOneGroup<Scope> | null
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
      if (groupId === null) {
        setGroupPair((oldPair) =>
          oldPair.groupId === null ? { ...oldPair, group: null } : oldPair
        )
        return
      }
      try {
        const group = (await serverConnector.readGroup(
          { id: groupId },
          {
            scope: scope
          }
        )) as ReadOneGroup<Scope>
        setGroupPair((oldPair) =>
          oldPair.groupId === groupId
            ? {
                ...oldPair,
                group: group
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить группу тестов с идентификатором ${groupId}`
          )
        }
      }
    },
    [scope, groupId, setGroupPair, notifier]
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
    detectedObjects: [groupId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

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
  const [groupPair, setGroupPair] = React.useState<{
    groupId: number | null
    group: ReadOneGroup<Scope> | null
  }>({
    groupId: null,
    group: null
  })
  React.useEffect(() => {
    setGroupPair((oldPair) => ({
      groupId: groupId,
      group: oldPair.group
    }))
  }, [groupId, setGroupPair])
  useGroupSubscription(
    scope,
    groupPair.groupId,
    setGroupPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return groupPair.group
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

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
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
    [scope, setGroups, notifier]
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
