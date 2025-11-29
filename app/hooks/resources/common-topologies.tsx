// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadCommonTopologyWithPrimaryPropsSuccessResultDto,
  ReadCommonTopologyWithUpToSecondaryPropsSuccessResultDto,
  ReadCommonTopologyWithUpToTertiaryPropsSuccessResultDto,
  ReadCommonTopologyWithAllPropsSuccessResultDto,
  ReadCommonTopologiesWithPrimaryPropsSuccessResultItemDto,
  ReadCommonTopologiesWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/common-topologies.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneCommonTopology<Scope extends ReadOneResourceScope> =
  DtoWithoutEnums<
    Scope extends 'PRIMARY_PROPS'
      ? ReadCommonTopologyWithPrimaryPropsSuccessResultDto
      : Scope extends 'UP_TO_SECONDARY_PROPS'
        ? ReadCommonTopologyWithUpToSecondaryPropsSuccessResultDto
        : Scope extends 'UP_TO_TERTIARY_PROPS'
          ? ReadCommonTopologyWithUpToTertiaryPropsSuccessResultDto
          : ReadCommonTopologyWithAllPropsSuccessResultDto
  >

type ReadManyCommonTopology<Scope extends ReadManyResourceScope> =
  DtoWithoutEnums<
    Scope extends 'PRIMARY_PROPS'
      ? ReadCommonTopologiesWithPrimaryPropsSuccessResultItemDto
      : ReadCommonTopologiesWithUpToSecondaryPropsSuccessResultItemDto
  >

/** Subscribe to commonTopology updates for existing commonTopology state */
export function useCommonTopologySubscription<
  Scope extends ReadOneResourceScope
>(
  scope: Scope,
  commonTopologyId: number | null,
  setCommonTopology:
    | React.Dispatch<React.SetStateAction<ReadOneCommonTopology<Scope>>>
    | React.Dispatch<React.SetStateAction<ReadOneCommonTopology<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (commonTopologyId === null || active === false) {
        return
      }
      try {
        const commonTopology = (await serverConnector.readCommonTopology(
          { id: commonTopologyId },
          {
            scope: scope
          }
        )) as ReadOneCommonTopology<Scope>
        setCommonTopology(commonTopology)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить общую топологию с идентификатором ${commonTopologyId}`
          )
        }
      }
    },
    [scope, commonTopologyId, setCommonTopology, active]
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

/** Subscribe to commonTopology updates with initial load */
export function useCommonTopology<Scope extends ReadOneResourceScope>(
  scope: Scope,
  commonTopologyId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [commonTopology, setCommonTopology] =
    React.useState<ReadOneCommonTopology<Scope> | null>(null)
  useCommonTopologySubscription(
    scope,
    commonTopologyId,
    setCommonTopology,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return commonTopology
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

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        if (active === false) {
          return
        }
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
    [scope, setCommonTopologies, active]
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
