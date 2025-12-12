// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  FragmentPrimary,
  FragmentSecondary,
  FragmentTertiary,
  FragmentAll
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneFragment<Scope extends ReadOneResourceScope> =
  Scope extends 'PRIMARY_PROPS'
    ? FragmentPrimary
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? FragmentSecondary
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? FragmentTertiary
        : FragmentAll

type ReadManyFragment<Scope extends ReadManyResourceScope> =
  Scope extends 'PRIMARY_PROPS' ? FragmentPrimary : FragmentSecondary

function useFragmentSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  fragmentId: number | null,
  setFragmentPair: React.Dispatch<
    React.SetStateAction<{
      fragmentId: number | null
      fragment?: ReadOneFragment<Scope> | null
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
      if (fragmentId === null) {
        setFragmentPair((oldPair) =>
          oldPair.fragmentId === null ? { ...oldPair, fragment: null } : oldPair
        )
        return
      }
      try {
        const fragment = (await serverConnector.readFragment(
          { id: fragmentId },
          {
            scope: scope
          }
        )) as ReadOneFragment<Scope>
        setFragmentPair((oldPair) =>
          oldPair.fragmentId === fragmentId
            ? {
                ...oldPair,
                fragment: fragment
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить фрагмент документа с идентификатором ${fragmentId}`
          )
        }
      }
    },
    [scope, fragmentId, setFragmentPair, notifier]
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
    detectedObjects: [fragmentId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    if (fragmentId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'FRAGMENT',
        resourceConfig: {
          id: fragmentId
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
  }, [scope, fragmentId, load])
}

/** Subscribe to fragment updates for existing fragment state */
export function useFragmentSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  fragmentId: number | null,
  setFragment: React.Dispatch<
    React.SetStateAction<ReadOneFragment<Scope> | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [fragmentPair, setFragmentPair] = React.useState<{
    fragmentId: number | null
    fragment?: ReadOneFragment<Scope> | null
  }>({
    fragmentId: fragmentId,
    fragment: undefined
  })
  React.useEffect(() => {
    setFragmentPair((oldPair) => ({
      fragmentId: fragmentId,
      fragment: oldPair.fragment
    }))
  }, [fragmentId, setFragmentPair])
  useFragmentSubscriptionInner(
    scope,
    fragmentPair.fragmentId,
    setFragmentPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (fragmentPair.fragment !== undefined) {
      setFragment(fragmentPair.fragment)
    }
  }, [setFragment, fragmentPair.fragment])
}

/** Subscribe to fragment updates with initial load */
export function useFragment<Scope extends ReadOneResourceScope>(
  scope: Scope,
  fragmentId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [fragmentPair, setFragmentPair] = React.useState<{
    fragmentId: number | null
    fragment?: ReadOneFragment<Scope> | null
  }>({
    fragmentId: fragmentId,
    fragment: null
  })
  React.useEffect(() => {
    setFragmentPair((oldPair) => ({
      fragmentId: fragmentId,
      fragment: oldPair.fragment
    }))
  }, [fragmentId, setFragmentPair])
  useFragmentSubscriptionInner(
    scope,
    fragmentPair.fragmentId,
    setFragmentPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return fragmentPair.fragment ?? null
}

/** Subscribe to fragments updates for existing fragments state */
export function useFragmentsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setFragments:
    | React.Dispatch<React.SetStateAction<ReadManyFragment<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyFragment<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        const fragments = (await serverConnector.readFragments({
          scope: scope
        })) as ReadManyFragment<Scope>[]
        setFragments(fragments)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список фрагментов документов'
          )
        }
      }
    },
    [scope, setFragments, notifier]
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
        type: 'FRAGMENT'
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

/** Subscribe to fragments updates with initial load */
export function useFragments<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [fragments, setFragments] = React.useState<
    ReadManyFragment<Scope>[] | null
  >(null)
  useFragmentsSubscription(
    scope,
    setFragments,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return fragments
}
