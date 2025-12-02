// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadTopologyWithPrimaryPropsSuccessResultDto,
  ReadTopologyWithUpToSecondaryPropsSuccessResultDto,
  ReadTopologyWithUpToTertiaryPropsSuccessResultDto,
  ReadTopologyWithAllPropsSuccessResultDto,
  ReadTopologiesWithPrimaryPropsSuccessResultItemDto,
  ReadTopologiesWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/topologies.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneTopology<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadTopologyWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadTopologyWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadTopologyWithUpToTertiaryPropsSuccessResultDto
        : ReadTopologyWithAllPropsSuccessResultDto
>

type ReadManyTopology<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadTopologiesWithPrimaryPropsSuccessResultItemDto
    : ReadTopologiesWithUpToSecondaryPropsSuccessResultItemDto
>

/** Subscribe to topology updates for existing topology state */
export function useTopologySubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  topologyId: number | null,
  setTopology: React.Dispatch<
    React.SetStateAction<ReadOneTopology<Scope> | null>
  >,
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
      if (topologyId === null) {
        setTopology(null as ReadOneTopology<Scope>)
        return
      }
      try {
        const topology = (await serverConnector.readTopology(
          { id: topologyId },
          {
            scope: scope
          }
        )) as ReadOneTopology<Scope>
        setTopology(topology)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить топологию с идентификатором ${topologyId}`
          )
        }
      }
    },
    [scope, topologyId, setTopology, active, notifier]
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
    if (topologyId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'TOPOLOGY',
        resourceConfig: {
          id: topologyId
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
  }, [scope, topologyId, load])
}

/** Subscribe to topology updates with initial load */
export function useTopology<Scope extends ReadOneResourceScope>(
  scope: Scope,
  topologyId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [topology, setTopology] = React.useState<ReadOneTopology<Scope> | null>(
    null
  )
  useTopologySubscription(
    scope,
    topologyId,
    setTopology,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return topology
}

/** Subscribe to topologies updates for existing topologies state */
export function useTopologiesSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setTopologies:
    | React.Dispatch<React.SetStateAction<ReadManyTopology<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyTopology<Scope>[] | null>>,
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
        const topologies = (await serverConnector.readTopologies({
          scope: scope
        })) as ReadManyTopology<Scope>[]
        setTopologies(topologies)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список топологий'
          )
        }
      }
    },
    [scope, setTopologies, active, notifier]
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
        type: 'TOPOLOGY'
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

/** Subscribe to topologies updates with initial load */
export function useTopologies<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [topologies, setTopologies] = React.useState<
    ReadManyTopology<Scope>[] | null
  >(null)
  useTopologiesSubscription(
    scope,
    setTopologies,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return topologies
}
