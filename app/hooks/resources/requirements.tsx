// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  RequirementsFilter,
  RequirementPrimary,
  RequirementSecondary,
  RequirementTertiary,
  RequirementAll
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'
// Other
import { isEqual } from 'lodash'

type ReadOneRequirement<Scope extends ReadOneResourceScope> =
  Scope extends 'PRIMARY_PROPS'
    ? RequirementPrimary
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? RequirementSecondary
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? RequirementTertiary
        : RequirementAll

type ReadManyRequirement<Scope extends ReadManyResourceScope> =
  Scope extends 'PRIMARY_PROPS' ? RequirementPrimary : RequirementSecondary

const EMPTY_REQUIREMENTS_ARR: RequirementAll[] = []

function useRequirementSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  requirementId: number | null,
  setRequirementPair: React.Dispatch<
    React.SetStateAction<{
      requirementId: number | null
      requirement?: ReadOneRequirement<Scope> | null
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
      if (requirementId === null) {
        setRequirementPair((oldPair) =>
          oldPair.requirementId === null
            ? { ...oldPair, requirement: null }
            : oldPair
        )
        return
      }
      try {
        const requirement = (await serverConnector.readRequirement(
          { id: requirementId },
          {
            scope: scope
          }
        )) as ReadOneRequirement<Scope>
        setRequirementPair((oldPair) =>
          oldPair.requirementId === requirementId
            ? {
                ...oldPair,
                requirement: requirement
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить требование с идентификатором ${requirementId}`
          )
        }
      }
    },
    [scope, requirementId, setRequirementPair, notifier]
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
    detectedObjects: [requirementId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    if (requirementId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'REQUIREMENT',
        resourceConfig: {
          id: requirementId
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
  }, [scope, requirementId, load])
}

/** Subscribe to requirement updates for existing requirement state */
export function useRequirementSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  requirementId: number | null,
  setRequirement: React.Dispatch<
    React.SetStateAction<ReadOneRequirement<Scope> | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [requirementPair, setRequirementPair] = React.useState<{
    requirementId: number | null
    requirement?: ReadOneRequirement<Scope> | null
  }>({
    requirementId: requirementId,
    requirement: undefined
  })
  React.useEffect(() => {
    setRequirementPair((oldPair) => ({
      requirementId: requirementId,
      requirement: oldPair.requirement
    }))
  }, [requirementId, setRequirementPair])
  useRequirementSubscriptionInner(
    scope,
    requirementPair.requirementId,
    setRequirementPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (requirementPair.requirement !== undefined) {
      setRequirement(requirementPair.requirement)
    }
  }, [setRequirement, requirementPair.requirement])
}

/** Subscribe to requirement updates with initial load */
export function useRequirement<Scope extends ReadOneResourceScope>(
  scope: Scope,
  requirementId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [requirementPair, setRequirementPair] = React.useState<{
    requirementId: number | null
    requirement?: ReadOneRequirement<Scope> | null
  }>({
    requirementId: requirementId,
    requirement: null
  })
  React.useEffect(() => {
    setRequirementPair((oldPair) => ({
      requirementId: requirementId,
      requirement: oldPair.requirement
    }))
  }, [requirementId, setRequirementPair])
  useRequirementSubscriptionInner(
    scope,
    requirementPair.requirementId,
    setRequirementPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return requirementPair.requirement ?? null
}

/** Subscribe to requirements updates for existing requirements state */
export function useRequirementsSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  setRequirements:
    | React.Dispatch<React.SetStateAction<ReadManyRequirement<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyRequirement<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        const requirements = (await serverConnector.readRequirements({
          scope: scope
        })) as ReadManyRequirement<Scope>[]
        setRequirements(requirements)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список требований'
          )
        }
      }
    },
    [scope, setRequirements, notifier]
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
        type: 'REQUIREMENT'
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

/** Subscribe to requirements updates with initial load */
export function useRequirements<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [requirements, setRequirements] = React.useState<
    ReadManyRequirement<Scope>[] | null
  >(null)
  useRequirementsSubscription(
    scope,
    setRequirements,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return requirements
}

type ExtraFilter = Omit<RequirementsFilter, 'requirementIds'>

function useRequirementsFilteredSubscriptionInner<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  requirementIds: number[] | null | undefined,
  extraFilter: ExtraFilter | null,
  setRequirementsPair: React.Dispatch<
    React.SetStateAction<{
      requirementIds?: number[] | null
      extraFilter: ExtraFilter | null
      requirements?: ReadManyRequirement<Scope>[] | null
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
        const requirements =
          requirementIds !== null
            ? ((await serverConnector.readRequirements({
                ids: requirementIds,
                ...extraFilter,
                scope: scope
              })) as ReadManyRequirement<Scope>[])
            : EMPTY_REQUIREMENTS_ARR
        setRequirementsPair((oldPair) =>
          isEqual(oldPair.requirementIds, requirementIds) &&
          isEqual(oldPair.extraFilter, extraFilter)
            ? {
                ...oldPair,
                requirements: requirements
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список требований'
          )
        }
      }
    },
    [scope, requirementIds, extraFilter, setRequirementsPair, notifier]
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

  // Process requirement ids change or extra filter change or active flag change to true
  useChangeDetector({
    detectedObjects: [requirementIds, extraFilter, active],
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
        type: 'REQUIREMENT'
      },
      (data) => {
        ;(() => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS') ||
            extraFilter !== null
          ) {
            void load(true)
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [scope, requirementIds, extraFilter, load])
}

/** Subscribe to requirements updates for existing requirements state */
export function useRequirementsFilteredSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  requirementIds: number[] | null | undefined,
  extraFilter: ExtraFilter | null,
  setRequirements: React.Dispatch<
    React.SetStateAction<ReadManyRequirement<Scope>[] | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [requirementsPair, setRequirementsPair] = React.useState<{
    requirementIds?: number[] | null
    extraFilter: ExtraFilter | null
    requirements?: ReadManyRequirement<Scope>[] | null
  }>({
    requirementIds: requirementIds,
    extraFilter: extraFilter,
    requirements: undefined
  })
  React.useEffect(() => {
    setRequirementsPair((oldPair) => ({
      requirementIds: requirementIds,
      extraFilter: extraFilter,
      requirements: oldPair.requirements
    }))
  }, [requirementIds, extraFilter, setRequirementsPair])
  useRequirementsFilteredSubscriptionInner(
    scope,
    requirementsPair.requirementIds,
    requirementsPair.extraFilter,
    setRequirementsPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (requirementsPair.requirements !== undefined) {
      setRequirements(requirementsPair.requirements)
    }
  }, [setRequirements, requirementsPair.requirements])
}

/** Subscribe to requirements updates with initial load */
export function useRequirementsFiltered<Scope extends ReadManyResourceScope>(
  scope: Scope,
  requirementIds: number[] | null | undefined,
  extraFilter: ExtraFilter | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [requirementsPair, setRequirementsPair] = React.useState<{
    requirementIds?: number[] | null
    extraFilter: ExtraFilter | null
    requirements?: ReadManyRequirement<Scope>[] | null
  }>({
    requirementIds: requirementIds,
    extraFilter: extraFilter,
    requirements: null
  })
  React.useEffect(() => {
    setRequirementsPair((oldPair) => ({
      requirementIds: requirementIds,
      extraFilter: extraFilter,
      requirements: oldPair.requirements
    }))
  }, [requirementIds, setRequirementsPair])
  useRequirementsFilteredSubscriptionInner(
    scope,
    requirementsPair.requirementIds,
    requirementsPair.extraFilter,
    setRequirementsPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return requirementsPair.requirements ?? null
}
