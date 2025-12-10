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
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'
// Other
import { isEqual } from 'lodash'

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

function useCoverageSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  coverageId: number | null,
  setCoveragePair: React.Dispatch<
    React.SetStateAction<{
      coverageId: number | null
      coverage?: ReadOneCoverage<Scope> | null
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
      if (coverageId === null) {
        setCoveragePair((oldPair) =>
          oldPair.coverageId === null ? { ...oldPair, coverage: null } : oldPair
        )
        return
      }
      try {
        const coverage = (await serverConnector.readCoverage(
          { id: coverageId },
          {
            scope: scope
          }
        )) as ReadOneCoverage<Scope>
        setCoveragePair((oldPair) =>
          oldPair.coverageId === coverageId
            ? {
                ...oldPair,
                coverage: coverage
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить покрытие требования с идентификатором ${coverageId}`
          )
        }
      }
    },
    [scope, coverageId, setCoveragePair, notifier]
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
    detectedObjects: [coverageId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

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

/** Subscribe to coverage updates for existing coverage state */
export function useCoverageSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  coverageId: number | null,
  setCoverage: React.Dispatch<
    React.SetStateAction<ReadOneCoverage<Scope> | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [coveragePair, setCoveragePair] = React.useState<{
    coverageId: number | null
    coverage?: ReadOneCoverage<Scope> | null
  }>({
    coverageId: coverageId,
    coverage: undefined
  })
  React.useEffect(() => {
    setCoveragePair((oldPair) => ({
      coverageId: coverageId,
      coverage: oldPair.coverage
    }))
  }, [coverageId, setCoveragePair])
  useCoverageSubscriptionInner(
    scope,
    coveragePair.coverageId,
    setCoveragePair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (coveragePair.coverage !== undefined) {
      setCoverage(coveragePair.coverage)
    }
  }, [setCoverage, coveragePair.coverage])
}

/** Subscribe to coverage updates with initial load */
export function useCoverage<Scope extends ReadOneResourceScope>(
  scope: Scope,
  coverageId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [coveragePair, setCoveragePair] = React.useState<{
    coverageId: number | null
    coverage?: ReadOneCoverage<Scope> | null
  }>({
    coverageId: coverageId,
    coverage: null
  })
  React.useEffect(() => {
    setCoveragePair((oldPair) => ({
      coverageId: coverageId,
      coverage: oldPair.coverage
    }))
  }, [coverageId, setCoveragePair])
  useCoverageSubscriptionInner(
    scope,
    coveragePair.coverageId,
    setCoveragePair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return coveragePair.coverage ?? null
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

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
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
    [scope, setCoverages, notifier]
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

function useCoveragesFilteredSubscriptionInner<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  coverageIds: number[],
  setCoveragesPair: React.Dispatch<
    React.SetStateAction<{
      coverageIds: number[]
      coverages?: ReadManyCoverage<Scope>[] | null
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
        const coverages = (await serverConnector.readCoverages({
          ids: coverageIds,
          scope: scope
        })) as ReadManyCoverage<Scope>[]
        setCoveragesPair((oldPair) =>
          isEqual(oldPair.coverageIds, coverageIds)
            ? {
                ...oldPair,
                coverages: coverages
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список покрытий требований'
          )
        }
      }
    },
    [scope, coverageIds, setCoveragesPair, notifier]
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

  // Process coverage ids change or active flag change to true
  useChangeDetector({
    detectedObjects: [coverageIds, active],
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
  }, [scope, coverageIds, load])
}

/** Subscribe to coverages updates for existing coverages state */
export function useCoveragesFilteredSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  coverageIds: number[],
  setCoverages: React.Dispatch<
    React.SetStateAction<ReadManyCoverage<Scope>[] | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [coveragesPair, setCoveragesPair] = React.useState<{
    coverageIds: number[]
    coverages?: ReadManyCoverage<Scope>[] | null
  }>({
    coverageIds: coverageIds,
    coverages: undefined
  })
  React.useEffect(() => {
    setCoveragesPair((oldPair) => ({
      coverageIds: coverageIds,
      coverages: oldPair.coverages
    }))
  }, [coverageIds, setCoveragesPair])
  useCoveragesFilteredSubscriptionInner(
    scope,
    coveragesPair.coverageIds,
    setCoveragesPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (coveragesPair.coverages !== undefined) {
      setCoverages(coveragesPair.coverages)
    }
  }, [setCoverages, coveragesPair.coverages])
}

/** Subscribe to coverages updates with initial load */
export function useCoveragesFiltered<Scope extends ReadManyResourceScope>(
  scope: Scope,
  coverageIds: number[],
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [coveragesPair, setCoveragesPair] = React.useState<{
    coverageIds: number[]
    coverages?: ReadManyCoverage<Scope>[] | null
  }>({
    coverageIds: coverageIds,
    coverages: null
  })
  React.useEffect(() => {
    setCoveragesPair((oldPair) => ({
      coverageIds: coverageIds,
      coverages: oldPair.coverages
    }))
  }, [coverageIds, setCoveragesPair])
  useCoveragesFilteredSubscriptionInner(
    scope,
    coveragesPair.coverageIds,
    setCoveragesPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return coveragesPair.coverages ?? null
}
