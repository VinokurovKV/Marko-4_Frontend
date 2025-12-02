// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadSubgroupWithPrimaryPropsSuccessResultDto,
  ReadSubgroupWithUpToSecondaryPropsSuccessResultDto,
  ReadSubgroupWithUpToTertiaryPropsSuccessResultDto,
  ReadSubgroupWithAllPropsSuccessResultDto,
  ReadSubgroupsWithPrimaryPropsSuccessResultItemDto,
  ReadSubgroupsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/subgroups.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneSubgroup<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadSubgroupWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadSubgroupWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadSubgroupWithUpToTertiaryPropsSuccessResultDto
        : ReadSubgroupWithAllPropsSuccessResultDto
>

type ReadManySubgroup<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadSubgroupsWithPrimaryPropsSuccessResultItemDto
    : ReadSubgroupsWithUpToSecondaryPropsSuccessResultItemDto
>

/** Subscribe to subgroup updates for existing subgroup state */
export function useSubgroupSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  subgroupId: number | null,
  setSubgroup: React.Dispatch<
    React.SetStateAction<ReadOneSubgroup<Scope> | null>
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
      if (subgroupId === null) {
        setSubgroup(null as ReadOneSubgroup<Scope>)
        return
      }
      try {
        const subgroup = (await serverConnector.readSubgroup(
          { id: subgroupId },
          {
            scope: scope
          }
        )) as ReadOneSubgroup<Scope>
        setSubgroup(subgroup)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить подгруппу тестов с идентификатором ${subgroupId}`
          )
        }
      }
    },
    [scope, subgroupId, setSubgroup, active, notifier]
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
    if (subgroupId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'SUBGROUP',
        resourceConfig: {
          id: subgroupId
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
  }, [scope, subgroupId, load])
}

/** Subscribe to subgroup updates with initial load */
export function useSubgroup<Scope extends ReadOneResourceScope>(
  scope: Scope,
  subgroupId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [subgroup, setSubgroup] = React.useState<ReadOneSubgroup<Scope> | null>(
    null
  )
  useSubgroupSubscription(
    scope,
    subgroupId,
    setSubgroup,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return subgroup
}

/** Subscribe to subgroups updates for existing subgroups state */
export function useSubgroupsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setSubgroups:
    | React.Dispatch<React.SetStateAction<ReadManySubgroup<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManySubgroup<Scope>[] | null>>,
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
        const subgroups = (await serverConnector.readSubgroups({
          scope: scope
        })) as ReadManySubgroup<Scope>[]
        setSubgroups(subgroups)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список подгрупп тестов'
          )
        }
      }
    },
    [scope, setSubgroups, active, notifier]
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
        type: 'SUBGROUP'
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

/** Subscribe to subgroups updates with initial load */
export function useSubgroups<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [subgroups, setSubgroups] = React.useState<
    ReadManySubgroup<Scope>[] | null
  >(null)
  useSubgroupsSubscription(
    scope,
    setSubgroups,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return subgroups
}
