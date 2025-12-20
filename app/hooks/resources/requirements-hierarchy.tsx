// Project
import type {
  RequirementsHierarchy,
  RequirementsHierarchyVertex
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

function useRequirementsHierarchyVertexSubscriptionInner(
  requirementId: number | null,
  setRequirementsHierarchyVertexPair: React.Dispatch<
    React.SetStateAction<{
      requirementId: number | null
      vertex?: RequirementsHierarchyVertex | null
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
        setRequirementsHierarchyVertexPair((oldPair) =>
          oldPair.requirementId === null
            ? { ...oldPair, vertex: null }
            : oldPair
        )
        return
      }
      try {
        const vertex = await serverConnector.readRequirementsHierarchyVertex({
          id: requirementId
        })
        setRequirementsHierarchyVertexPair((oldPair) =>
          oldPair.requirementId === requirementId
            ? {
                ...oldPair,
                vertex: vertex
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить вершину иерархии требований с идентификатором ${requirementId}`
          )
        }
      }
    },
    [requirementId, setRequirementsHierarchyVertexPair, notifier]
  )

  // Initial load
  React.useEffect(() => {
    setInitialized(true)
    if (active === false || withInitialLoad === false || initialized) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [
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
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'REQUIREMENT'
      },
      (data) => {
        ;(() => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            updateScope.secondaryProps ||
            updateScope.tertiaryProps
          ) {
            void load(true)
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [requirementId, load])
}

/** Subscribe to requirements hierarchy vertex updates for existing requirements hierarchy vertex state */
export function useRequirementsHierarchyVertexSubscription(
  requirementId: number | null,
  setRequirementsHierarchyVertex: React.Dispatch<
    React.SetStateAction<RequirementsHierarchyVertex | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [requirementsHierarchyVertexPair, setRequirementsHierarchyVertexPair] =
    React.useState<{
      requirementId: number | null
      vertex?: RequirementsHierarchyVertex | null
    }>({
      requirementId: requirementId,
      vertex: undefined
    })
  React.useEffect(() => {
    setRequirementsHierarchyVertexPair((oldPair) => ({
      requirementId: requirementId,
      vertex: oldPair.vertex
    }))
  }, [requirementId, setRequirementsHierarchyVertexPair])
  useRequirementsHierarchyVertexSubscriptionInner(
    requirementsHierarchyVertexPair.requirementId,
    setRequirementsHierarchyVertexPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (requirementsHierarchyVertexPair.vertex !== undefined) {
      setRequirementsHierarchyVertex(requirementsHierarchyVertexPair.vertex)
    }
  }, [setRequirementsHierarchyVertex, requirementsHierarchyVertexPair.vertex])
}

/** Subscribe to requirements hierarchy vertex updates with initial load */
export function useRequirementsHierarchyVertex(
  requirementId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [requirementsHierarchyVertexPair, setRequirementsHierarchyVertexPair] =
    React.useState<{
      requirementId: number | null
      vertex?: RequirementsHierarchyVertex | null
    }>({
      requirementId: requirementId,
      vertex: null
    })
  React.useEffect(() => {
    setRequirementsHierarchyVertexPair((oldPair) => ({
      requirementId: requirementId,
      vertex: oldPair.vertex
    }))
  }, [requirementId, setRequirementsHierarchyVertexPair])
  useRequirementsHierarchyVertexSubscriptionInner(
    requirementsHierarchyVertexPair.requirementId,
    setRequirementsHierarchyVertexPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return requirementsHierarchyVertexPair.vertex ?? null
}

/** Subscribe to requirements hierarchy updates for existing requirements hierarchy state */
export function useRequirementsHierarchySubscription(
  setRequirementsHierarchy:
    | React.Dispatch<React.SetStateAction<RequirementsHierarchy>>
    | React.Dispatch<React.SetStateAction<RequirementsHierarchy | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        const requirementsHierarchy =
          await serverConnector.readRequirementsHierarchy()
        setRequirementsHierarchy(requirementsHierarchy)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальную иерархию требований'
          )
        }
      }
    },
    [setRequirementsHierarchy, notifier]
  )

  // Initial load
  React.useEffect(() => {
    setInitialized(true)
    if (active === false || withInitialLoad === false || initialized) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [
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
            updateScope.secondaryProps ||
            updateScope.tertiaryProps
          ) {
            void load(true)
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [load])
}

/** Subscribe to requirements hierarchy updates with initial load */
export function useRequirementsHierarchy(
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [requirementsHierarchy, setRequirementsHierarchy] =
    React.useState<RequirementsHierarchy | null>(null)
  useRequirementsHierarchySubscription(
    setRequirementsHierarchy,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return requirementsHierarchy
}
