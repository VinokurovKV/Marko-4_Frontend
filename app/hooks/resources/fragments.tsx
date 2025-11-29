// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadFragmentWithPrimaryPropsSuccessResultDto,
  ReadFragmentWithUpToSecondaryPropsSuccessResultDto,
  ReadFragmentWithUpToTertiaryPropsSuccessResultDto,
  ReadFragmentWithAllPropsSuccessResultDto,
  ReadFragmentsWithPrimaryPropsSuccessResultItemDto,
  ReadFragmentsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/fragments.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneFragment<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadFragmentWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadFragmentWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadFragmentWithUpToTertiaryPropsSuccessResultDto
        : ReadFragmentWithAllPropsSuccessResultDto
>

type ReadManyFragment<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadFragmentsWithPrimaryPropsSuccessResultItemDto
    : ReadFragmentsWithUpToSecondaryPropsSuccessResultItemDto
>

/** Subscribe to fragment updates for existing fragment state */
export function useFragmentSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  fragmentId: number | null,
  setFragment:
    | React.Dispatch<React.SetStateAction<ReadOneFragment<Scope>>>
    | React.Dispatch<React.SetStateAction<ReadOneFragment<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (fragmentId === null || active === false) {
        return
      }
      try {
        const fragment = (await serverConnector.readFragment(
          { id: fragmentId },
          {
            scope: scope
          }
        )) as ReadOneFragment<Scope>
        setFragment(fragment)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить фрагмент документа с идентификатором ${fragmentId}`
          )
        }
      }
    },
    [scope, fragmentId, setFragment, active]
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

/** Subscribe to fragment updates with initial load */
export function useFragment<Scope extends ReadOneResourceScope>(
  scope: Scope,
  fragmentId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [fragment, setFragment] = React.useState<ReadOneFragment<Scope> | null>(
    null
  )
  useFragmentSubscription(
    scope,
    fragmentId,
    setFragment,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return fragment
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

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        if (active === false) {
          return
        }
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
    [scope, setFragments, active]
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
