// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadRequirementWithPrimaryPropsSuccessResultDto,
  ReadRequirementWithUpToSecondaryPropsSuccessResultDto,
  ReadRequirementWithUpToTertiaryPropsSuccessResultDto,
  ReadRequirementWithAllPropsSuccessResultDto,
  ReadRequirementsWithPrimaryPropsSuccessResultItemDto,
  ReadRequirementsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/requirements.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneRequirement<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadRequirementWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadRequirementWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadRequirementWithUpToTertiaryPropsSuccessResultDto
        : ReadRequirementWithAllPropsSuccessResultDto
>

type ReadManyRequirement<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadRequirementsWithPrimaryPropsSuccessResultItemDto
    : ReadRequirementsWithUpToSecondaryPropsSuccessResultItemDto
>

/** Subscribe to requirement updates for existing requirement state */
export function useRequirementSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  requirementId: number | null,
  setRequirement:
    | React.Dispatch<React.SetStateAction<ReadOneRequirement<Scope>>>
    | React.Dispatch<React.SetStateAction<ReadOneRequirement<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (requirementId === null || active === false) {
        return
      }
      try {
        const requirement = (await serverConnector.readRequirement(
          { id: requirementId },
          {
            scope: scope
          }
        )) as ReadOneRequirement<Scope>
        setRequirement(requirement)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить требование с идентификатором ${requirementId}`
          )
        }
      }
    },
    [scope, requirementId, setRequirement, active]
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
    if (requirementId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'REQUIREMENT',
        resourceConfig: {
          id: requirementId
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
  }, [scope, requirementId, load])
}

/** Subscribe to requirement updates with initial load */
export function useRequirement<Scope extends ReadOneResourceScope>(
  scope: Scope,
  requirementId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [requirement, setRequirement] =
    React.useState<ReadOneRequirement<Scope> | null>(null)
  useRequirementSubscription(
    scope,
    requirementId,
    setRequirement,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return requirement
}

/** Subscribe to requirements updates for existing requirements state */
export function useRequirementsSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  setRequirements:
    | React.Dispatch<React.SetStateAction<ReadManyRequirement<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyRequirement<Scope>[] | null>>,
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
        const requirements = (await serverConnector.readRequirements({
          scope: scope
        })) as ReadManyRequirement<Scope>[]
        setRequirements(requirements)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список требований'
          )
        }
      }
    },
    [scope, setRequirements, active]
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
        type: 'REQUIREMENT'
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

/** Subscribe to requirements updates with initial load */
export function useRequirements<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [requirements, setRequirements] = React.useState<
    ReadManyRequirement<Scope>[] | null
  >(null)
  useRequirementsSubscription(
    scope,
    setRequirements,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return requirements
}
