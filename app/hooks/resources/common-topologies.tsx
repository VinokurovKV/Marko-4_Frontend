// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  CommonTopologyPrimary,
  CommonTopologySecondary,
  CommonTopologyTertiary,
  CommonTopologyAll
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneCommonTopology<Scope extends ReadOneResourceScope> =
  Scope extends 'PRIMARY_PROPS'
    ? CommonTopologyPrimary
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? CommonTopologySecondary
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? CommonTopologyTertiary
        : CommonTopologyAll

type ReadManyCommonTopology<Scope extends ReadManyResourceScope> =
  Scope extends 'PRIMARY_PROPS'
    ? CommonTopologyPrimary
    : CommonTopologySecondary

function useCommonTopologySubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  commonTopologyId: number | null,
  setCommonTopologyPair: React.Dispatch<
    React.SetStateAction<{
      commonTopologyId: number | null
      commonTopology?: ReadOneCommonTopology<Scope> | null
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
      if (commonTopologyId === null) {
        setCommonTopologyPair((oldPair) =>
          oldPair.commonTopologyId === null
            ? { ...oldPair, commonTopology: null }
            : oldPair
        )
        return
      }
      try {
        const commonTopology = (await serverConnector.readCommonTopology(
          { id: commonTopologyId },
          {
            scope: scope
          }
        )) as ReadOneCommonTopology<Scope>
        setCommonTopologyPair((oldPair) =>
          oldPair.commonTopologyId === commonTopologyId
            ? {
                ...oldPair,
                commonTopology: commonTopology
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить общую топологию с идентификатором ${commonTopologyId}`
          )
        }
      }
    },
    [scope, commonTopologyId, setCommonTopologyPair, notifier]
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
    detectedObjects: [commonTopologyId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    if (commonTopologyId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'COMMON_TOPOLOGY',
        resourceConfig: {
          id: commonTopologyId
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
  }, [scope, commonTopologyId, load])
}

/** Subscribe to commonTopology updates for existing commonTopology state */
export function useCommonTopologySubscription<
  Scope extends ReadOneResourceScope
>(
  scope: Scope,
  commonTopologyId: number | null,
  setCommonTopology: React.Dispatch<
    React.SetStateAction<ReadOneCommonTopology<Scope> | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [commonTopologyPair, setCommonTopologyPair] = React.useState<{
    commonTopologyId: number | null
    commonTopology?: ReadOneCommonTopology<Scope> | null
  }>({
    commonTopologyId: commonTopologyId,
    commonTopology: undefined
  })
  React.useEffect(() => {
    setCommonTopologyPair((oldPair) => ({
      commonTopologyId: commonTopologyId,
      commonTopology: oldPair.commonTopology
    }))
  }, [commonTopologyId, setCommonTopologyPair])
  useCommonTopologySubscriptionInner(
    scope,
    commonTopologyPair.commonTopologyId,
    setCommonTopologyPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (commonTopologyPair.commonTopology !== undefined) {
      setCommonTopology(commonTopologyPair.commonTopology)
    }
  }, [setCommonTopology, commonTopologyPair.commonTopology])
}

/** Subscribe to commonTopology updates with initial load */
export function useCommonTopology<Scope extends ReadOneResourceScope>(
  scope: Scope,
  commonTopologyId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [commonTopologyPair, setCommonTopologyPair] = React.useState<{
    commonTopologyId: number | null
    commonTopology?: ReadOneCommonTopology<Scope> | null
  }>({
    commonTopologyId: commonTopologyId,
    commonTopology: null
  })
  React.useEffect(() => {
    setCommonTopologyPair((oldPair) => ({
      commonTopologyId: commonTopologyId,
      commonTopology: oldPair.commonTopology
    }))
  }, [commonTopologyId, setCommonTopologyPair])
  useCommonTopologySubscriptionInner(
    scope,
    commonTopologyPair.commonTopologyId,
    setCommonTopologyPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return commonTopologyPair.commonTopology ?? null
}

/** Subscribe to commonTopologies updates for existing commonTopologies state */
export function useCommonTopologiesSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  setCommonTopologies:
    | React.Dispatch<React.SetStateAction<ReadManyCommonTopology<Scope>[]>>
    | React.Dispatch<
        React.SetStateAction<ReadManyCommonTopology<Scope>[] | null>
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
        const commonTopologies = (await serverConnector.readCommonTopologies({
          scope: scope
        })) as ReadManyCommonTopology<Scope>[]
        setCommonTopologies(commonTopologies)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список общих топологий'
          )
        }
      }
    },
    [scope, setCommonTopologies, notifier]
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
        type: 'COMMON_TOPOLOGY'
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

/** Subscribe to commonTopologies updates with initial load */
export function useCommonTopologies<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [commonTopologies, setCommonTopologies] = React.useState<
    ReadManyCommonTopology<Scope>[] | null
  >(null)
  useCommonTopologiesSubscription(
    scope,
    setCommonTopologies,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return commonTopologies
}
