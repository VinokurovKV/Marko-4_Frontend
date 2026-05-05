// Project
import type { ActionInfo } from '~/types'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from './change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'
// Other
import { isEqual } from 'lodash'

const EMPTY_ACTIONS_ARR: ActionInfo[] = []

/** Subscribe to actions updates for existing actions state */
export function useActionsSubscription(
  setActions:
    | React.Dispatch<React.SetStateAction<ActionInfo[]>>
    | React.Dispatch<React.SetStateAction<ActionInfo[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        const actions = (await serverConnector.readActionInfos(
          {}
        )) as ActionInfo[]
        setActions(actions)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список действий'
          )
        }
      }
    },
    [setActions, notifier]
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
    const subscriptionId = serverConnector.subscribeToActionInfos({}, () => {
      ;(() => {
        void load(true)
      })()
    }).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [load])
}

/** Subscribe to actions updates with initial load */
export function useActions(
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [actions, setActions] = React.useState<ActionInfo[] | null>(null)
  useActionsSubscription(
    setActions,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return actions
}

function useActionsFilteredSubscriptionInner(
  actionIds: number[] | null,
  setActionsPair: React.Dispatch<
    React.SetStateAction<{
      actionIds: number[] | null
      actions?: ActionInfo[] | null
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
        const actions =
          actionIds !== null
            ? ((await serverConnector.readActionInfos({
                ids: actionIds
              })) as ActionInfo[])
            : EMPTY_ACTIONS_ARR
        setActionsPair((oldPair) =>
          isEqual(oldPair.actionIds, actionIds)
            ? {
                ...oldPair,
                actions: actions
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список действий'
          )
        }
      }
    },
    [actionIds, setActionsPair, notifier]
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

  // Process action ids change or active flag change to true
  useChangeDetector({
    detectedObjects: [actionIds, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToActionInfos({}, () => {
      ;(() => {
        void load(true)
      })()
    }).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [actionIds, load])
}

/** Subscribe to actions updates for existing actions state */
export function useActionsFilteredSubscription(
  actionIds: number[] | null,
  setActions: React.Dispatch<React.SetStateAction<ActionInfo[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [actionsPair, setActionsPair] = React.useState<{
    actionIds: number[] | null
    actions?: ActionInfo[] | null
  }>({
    actionIds: actionIds,
    actions: undefined
  })
  React.useEffect(() => {
    setActionsPair((oldPair) => ({
      actionIds: actionIds,
      actions: oldPair.actions
    }))
  }, [actionIds, setActionsPair])
  useActionsFilteredSubscriptionInner(
    actionsPair.actionIds,
    setActionsPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (actionsPair.actions !== undefined) {
      setActions(actionsPair.actions)
    }
  }, [setActions, actionsPair.actions])
}

/** Subscribe to actions updates with initial load */
export function useActionsFiltered(
  actionIds: number[] | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [actionsPair, setActionsPair] = React.useState<{
    actionIds: number[] | null
    actions?: ActionInfo[] | null
  }>({
    actionIds: actionIds,
    actions: null
  })
  React.useEffect(() => {
    setActionsPair((oldPair) => ({
      actionIds: actionIds,
      actions: oldPair.actions
    }))
  }, [actionIds, setActionsPair])
  useActionsFilteredSubscriptionInner(
    actionsPair.actionIds,
    setActionsPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return actionsPair.actions ?? null
}
