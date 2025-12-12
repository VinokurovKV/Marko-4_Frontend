// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  SubgroupPrimary,
  SubgroupSecondary,
  SubgroupTertiary,
  SubgroupAll
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneSubgroup<Scope extends ReadOneResourceScope> =
  Scope extends 'PRIMARY_PROPS'
    ? SubgroupPrimary
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? SubgroupSecondary
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? SubgroupTertiary
        : SubgroupAll

type ReadManySubgroup<Scope extends ReadManyResourceScope> =
  Scope extends 'PRIMARY_PROPS' ? SubgroupPrimary : SubgroupSecondary

function useSubgroupSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  subgroupId: number | null,
  setSubgroupPair: React.Dispatch<
    React.SetStateAction<{
      subgroupId: number | null
      subgroup?: ReadOneSubgroup<Scope> | null
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
      if (subgroupId === null) {
        setSubgroupPair((oldPair) =>
          oldPair.subgroupId === null ? { ...oldPair, subgroup: null } : oldPair
        )
        return
      }
      try {
        const subgroup = (await serverConnector.readSubgroup(
          { id: subgroupId },
          {
            scope: scope
          }
        )) as ReadOneSubgroup<Scope>
        setSubgroupPair((oldPair) =>
          oldPair.subgroupId === subgroupId
            ? {
                ...oldPair,
                subgroup: subgroup
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить подгруппу тестов с идентификатором ${subgroupId}`
          )
        }
      }
    },
    [scope, subgroupId, setSubgroupPair, notifier]
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
    detectedObjects: [subgroupId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    if (subgroupId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'SUBGROUP',
        resourceConfig: {
          id: subgroupId
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
  }, [scope, subgroupId, load])
}

/** Subscribe to subgroup updates for existing subgroup state */
export function useSubgroupSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  subgroupId: number | null,
  setSubgroup: React.Dispatch<
    React.SetStateAction<ReadOneSubgroup<Scope> | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [subgroupPair, setSubgroupPair] = React.useState<{
    subgroupId: number | null
    subgroup?: ReadOneSubgroup<Scope> | null
  }>({
    subgroupId: subgroupId,
    subgroup: undefined
  })
  React.useEffect(() => {
    setSubgroupPair((oldPair) => ({
      subgroupId: subgroupId,
      subgroup: oldPair.subgroup
    }))
  }, [subgroupId, setSubgroupPair])
  useSubgroupSubscriptionInner(
    scope,
    subgroupPair.subgroupId,
    setSubgroupPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (subgroupPair.subgroup !== undefined) {
      setSubgroup(subgroupPair.subgroup)
    }
  }, [setSubgroup, subgroupPair.subgroup])
}

/** Subscribe to subgroup updates with initial load */
export function useSubgroup<Scope extends ReadOneResourceScope>(
  scope: Scope,
  subgroupId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [subgroupPair, setSubgroupPair] = React.useState<{
    subgroupId: number | null
    subgroup?: ReadOneSubgroup<Scope> | null
  }>({
    subgroupId: subgroupId,
    subgroup: null
  })
  React.useEffect(() => {
    setSubgroupPair((oldPair) => ({
      subgroupId: subgroupId,
      subgroup: oldPair.subgroup
    }))
  }, [subgroupId, setSubgroupPair])
  useSubgroupSubscriptionInner(
    scope,
    subgroupPair.subgroupId,
    setSubgroupPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return subgroupPair.subgroup ?? null
}

/** Subscribe to subgroups updates for existing subgroups state */
export function useSubgroupsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setSubgroups:
    | React.Dispatch<React.SetStateAction<ReadManySubgroup<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManySubgroup<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        const subgroups = (await serverConnector.readSubgroups({
          scope: scope
        })) as ReadManySubgroup<Scope>[]
        setSubgroups(subgroups)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список подгрупп тестов'
          )
        }
      }
    },
    [scope, setSubgroups, notifier]
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
        type: 'SUBGROUP'
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

/** Subscribe to subgroups updates with initial load */
export function useSubgroups<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [subgroups, setSubgroups] = React.useState<
    ReadManySubgroup<Scope>[] | null
  >(null)
  useSubgroupsSubscription(
    scope,
    setSubgroups,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return subgroups
}
