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
import { useChangeDetector } from '../change-detector'
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
  setCommonTopologyPair: React.Dispatch<
    React.SetStateAction<{
      commonTopologyId: number | null
      commonTopology: ReadOneCommonTopology<Scope> | null
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

/** Subscribe to commonTopology updates with initial load */
export function useCommonTopology<Scope extends ReadOneResourceScope>(
  scope: Scope,
  commonTopologyId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [commonTopologyPair, setCommonTopologyPair] = React.useState<{
    commonTopologyId: number | null
    commonTopology: ReadOneCommonTopology<Scope> | null
  }>({
    commonTopologyId: null,
    commonTopology: null
  })
  React.useEffect(() => {
    setCommonTopologyPair((oldPair) => ({
      commonTopologyId: commonTopologyId,
      commonTopology: oldPair.commonTopology
    }))
  }, [commonTopologyId, setCommonTopologyPair])
  useCommonTopologySubscription(
    scope,
    commonTopologyPair.commonTopologyId,
    setCommonTopologyPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return commonTopologyPair.commonTopology
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
