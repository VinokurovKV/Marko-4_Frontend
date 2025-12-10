// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadDbcWithPrimaryPropsSuccessResultDto,
  ReadDbcWithUpToSecondaryPropsSuccessResultDto,
  ReadDbcWithUpToTertiaryPropsSuccessResultDto,
  ReadDbcWithAllPropsSuccessResultDto,
  ReadDbcsWithPrimaryPropsSuccessResultItemDto,
  ReadDbcsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/dbcs.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'
// Other
import { isEqual } from 'lodash'

type ReadOneDbc<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadDbcWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadDbcWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadDbcWithUpToTertiaryPropsSuccessResultDto
        : ReadDbcWithAllPropsSuccessResultDto
>

type ReadManyDbc<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadDbcsWithPrimaryPropsSuccessResultItemDto
    : ReadDbcsWithUpToSecondaryPropsSuccessResultItemDto
>

function useDbcSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  dbcId: number | null,
  setDbcPair: React.Dispatch<
    React.SetStateAction<{
      dbcId: number | null
      dbc?: ReadOneDbc<Scope> | null
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
      if (dbcId === null) {
        setDbcPair((oldPair) =>
          oldPair.dbcId === null ? { ...oldPair, dbc: null } : oldPair
        )
        return
      }
      try {
        const dbc = (await serverConnector.readDbc(
          { id: dbcId },
          {
            scope: scope
          }
        )) as ReadOneDbc<Scope>
        setDbcPair((oldPair) =>
          oldPair.dbcId === dbcId
            ? {
                ...oldPair,
                dbc: dbc
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить базовую конфигурацию с идентификатором ${dbcId}`
          )
        }
      }
    },
    [scope, dbcId, setDbcPair, notifier]
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
    detectedObjects: [dbcId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    if (dbcId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'DBC',
        resourceConfig: {
          id: dbcId
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
  }, [scope, dbcId, load])
}

/** Subscribe to dbc updates for existing dbc state */
export function useDbcSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  dbcId: number | null,
  setDbc: React.Dispatch<React.SetStateAction<ReadOneDbc<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [dbcPair, setDbcPair] = React.useState<{
    dbcId: number | null
    dbc?: ReadOneDbc<Scope> | null
  }>({
    dbcId: dbcId,
    dbc: undefined
  })
  React.useEffect(() => {
    setDbcPair((oldPair) => ({
      dbcId: dbcId,
      dbc: oldPair.dbc
    }))
  }, [dbcId, setDbcPair])
  useDbcSubscriptionInner(
    scope,
    dbcPair.dbcId,
    setDbcPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (dbcPair.dbc !== undefined) {
      setDbc(dbcPair.dbc)
    }
  }, [setDbc, dbcPair.dbc])
}

/** Subscribe to dbc updates with initial load */
export function useDbc<Scope extends ReadOneResourceScope>(
  scope: Scope,
  dbcId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [dbcPair, setDbcPair] = React.useState<{
    dbcId: number | null
    dbc?: ReadOneDbc<Scope> | null
  }>({
    dbcId: dbcId,
    dbc: null
  })
  React.useEffect(() => {
    setDbcPair((oldPair) => ({
      dbcId: dbcId,
      dbc: oldPair.dbc
    }))
  }, [dbcId, setDbcPair])
  useDbcSubscriptionInner(
    scope,
    dbcPair.dbcId,
    setDbcPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return dbcPair.dbc ?? null
}

/** Subscribe to dbcs updates for existing dbcs state */
export function useDbcsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setDbcs:
    | React.Dispatch<React.SetStateAction<ReadManyDbc<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyDbc<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        const dbcs = (await serverConnector.readDbcs({
          scope: scope
        })) as ReadManyDbc<Scope>[]
        setDbcs(dbcs)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список базовых конфигураций'
          )
        }
      }
    },
    [scope, setDbcs, notifier]
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
        type: 'DBC'
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

/** Subscribe to dbcs updates with initial load */
export function useDbcs<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [dbcs, setDbcs] = React.useState<ReadManyDbc<Scope>[] | null>(null)
  useDbcsSubscription(
    scope,
    setDbcs,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return dbcs
}

function useDbcsFilteredSubscriptionInner<Scope extends ReadManyResourceScope>(
  scope: Scope,
  dbcIds: number[],
  setDbcsPair: React.Dispatch<
    React.SetStateAction<{
      dbcIds: number[]
      dbcs?: ReadManyDbc<Scope>[] | null
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
        const dbcs = (await serverConnector.readDbcs({
          ids: dbcIds,
          scope: scope
        })) as ReadManyDbc<Scope>[]
        setDbcsPair((oldPair) =>
          isEqual(oldPair.dbcIds, dbcIds)
            ? {
                ...oldPair,
                dbcs: dbcs
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список базовых конфигураций'
          )
        }
      }
    },
    [scope, dbcIds, setDbcsPair, notifier]
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

  // Process dbc ids change or active flag change to true
  useChangeDetector({
    detectedObjects: [dbcIds, active],
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
        type: 'DBC'
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
  }, [scope, dbcIds, load])
}

/** Subscribe to dbcs updates for existing dbcs state */
export function useDbcsFilteredSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  dbcIds: number[],
  setDbcs: React.Dispatch<React.SetStateAction<ReadManyDbc<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [dbcsPair, setDbcsPair] = React.useState<{
    dbcIds: number[]
    dbcs?: ReadManyDbc<Scope>[] | null
  }>({
    dbcIds: dbcIds,
    dbcs: undefined
  })
  React.useEffect(() => {
    setDbcsPair((oldPair) => ({
      dbcIds: dbcIds,
      dbcs: oldPair.dbcs
    }))
  }, [dbcIds, setDbcsPair])
  useDbcsFilteredSubscriptionInner(
    scope,
    dbcsPair.dbcIds,
    setDbcsPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (dbcsPair.dbcs !== undefined) {
      setDbcs(dbcsPair.dbcs)
    }
  }, [setDbcs, dbcsPair.dbcs])
}

/** Subscribe to dbcs updates with initial load */
export function useDbcsFiltered<Scope extends ReadManyResourceScope>(
  scope: Scope,
  dbcIds: number[],
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [dbcsPair, setDbcsPair] = React.useState<{
    dbcIds: number[]
    dbcs?: ReadManyDbc<Scope>[] | null
  }>({
    dbcIds: dbcIds,
    dbcs: null
  })
  React.useEffect(() => {
    setDbcsPair((oldPair) => ({
      dbcIds: dbcIds,
      dbcs: oldPair.dbcs
    }))
  }, [dbcIds, setDbcsPair])
  useDbcsFilteredSubscriptionInner(
    scope,
    dbcsPair.dbcIds,
    setDbcsPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return dbcsPair.dbcs ?? null
}
