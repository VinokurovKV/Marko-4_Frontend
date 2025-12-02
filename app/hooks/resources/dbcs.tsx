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
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

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

/** Subscribe to dbc updates for existing dbc state */
export function useDbcSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  dbcId: number | null,
  setDbc: React.Dispatch<React.SetStateAction<ReadOneDbc<Scope> | null>>,
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
      if (dbcId === null) {
        setDbc(null as ReadOneDbc<Scope>)
        return
      }
      try {
        const dbc = (await serverConnector.readDbc(
          { id: dbcId },
          {
            scope: scope
          }
        )) as ReadOneDbc<Scope>
        setDbc(dbc)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить базовую конфигурацию с идентификатором ${dbcId}`
          )
        }
      }
    },
    [scope, dbcId, setDbc, active, notifier]
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

/** Subscribe to dbc updates with initial load */
export function useDbc<Scope extends ReadOneResourceScope>(
  scope: Scope,
  dbcId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [dbc, setDbc] = React.useState<ReadOneDbc<Scope> | null>(null)
  useDbcSubscription(
    scope,
    dbcId,
    setDbc,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return dbc
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

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        if (active === false) {
          return
        }
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
    [scope, setDbcs, active, notifier]
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
