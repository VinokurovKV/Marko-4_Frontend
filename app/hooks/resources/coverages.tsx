// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadCoverageWithPrimaryPropsSuccessResultDto,
  ReadCoverageWithUpToSecondaryPropsSuccessResultDto,
  ReadCoverageWithUpToTertiaryPropsSuccessResultDto,
  ReadCoverageWithAllPropsSuccessResultDto,
  ReadCoveragesWithPrimaryPropsSuccessResultItemDto,
  ReadCoveragesWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/coverages.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneCoverage<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadCoverageWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadCoverageWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadCoverageWithUpToTertiaryPropsSuccessResultDto
        : ReadCoverageWithAllPropsSuccessResultDto
>

type ReadManyCoverage<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadCoveragesWithPrimaryPropsSuccessResultItemDto
    : ReadCoveragesWithUpToSecondaryPropsSuccessResultItemDto
>

/** Subscribe to coverage updates for existing coverage state */
export function useCoverageSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  coverageId: number | null,
  setCoverage:
    | React.Dispatch<React.SetStateAction<ReadOneCoverage<Scope>>>
    | React.Dispatch<React.SetStateAction<ReadOneCoverage<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (coverageId === null || active === false) {
        return
      }
      try {
        const coverage = (await serverConnector.readCoverage(
          { id: coverageId },
          {
            scope: scope
          }
        )) as ReadOneCoverage<Scope>
        setCoverage(coverage)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить покрытие требования с идентификатором ${coverageId}`
          )
        }
      }
    },
    [scope, coverageId, setCoverage, active]
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
    if (coverageId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'COVERAGE',
        resourceConfig: {
          id: coverageId
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
  }, [scope, coverageId, load])
}

/** Subscribe to coverage updates with initial load */
export function useCoverage<Scope extends ReadOneResourceScope>(
  scope: Scope,
  coverageId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [coverage, setCoverage] = React.useState<ReadOneCoverage<Scope> | null>(
    null
  )
  useCoverageSubscription(
    scope,
    coverageId,
    setCoverage,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return coverage
}

/** Subscribe to coverages updates for existing coverages state */
export function useCoveragesSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setCoverages:
    | React.Dispatch<React.SetStateAction<ReadManyCoverage<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyCoverage<Scope>[] | null>>,
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
        const coverages = (await serverConnector.readCoverages({
          scope: scope
        })) as ReadManyCoverage<Scope>[]
        setCoverages(coverages)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список покрытий требований'
          )
        }
      }
    },
    [scope, setCoverages, active]
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
        type: 'COVERAGE'
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

/** Subscribe to coverages updates with initial load */
export function useCoverages<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [coverages, setCoverages] = React.useState<
    ReadManyCoverage<Scope>[] | null
  >(null)
  useCoveragesSubscription(
    scope,
    setCoverages,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return coverages
}
