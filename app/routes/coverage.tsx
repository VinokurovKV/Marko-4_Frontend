// Project
import type {
  TagPrimary,
  RequirementPrimary,
  CoverageTertiary,
  TestPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTagsPrimaryFiltered,
  readRequirementPrimary,
  readCoverageTertiary,
  readTestsPrimaryFiltered
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useRequirementSubscription,
  useCoverageSubscription,
  useTestsFilteredSubscription
} from '~/hooks/resources'
import { CoverageViewer } from '~/components/single-resource-viewers/resources/coverage'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/coverage'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const coverageId = (() => {
    const parsed = parseInt(params.coverageId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [coverage] = await Promise.all([readCoverageTertiary(coverageId)])
  const [tags, requirement, tests] = await Promise.all([
    readTagsPrimaryFiltered(coverage?.tagIds ?? null),
    readRequirementPrimary(coverage?.requirementId ?? null),
    readTestsPrimaryFiltered(coverage?.testIds ?? null)
  ])
  return {
    coverageId,
    tags,
    requirement,
    coverage,
    tests
  }
}

function CoverageRouteInner({
  loaderData: {
    coverageId,
    tags: initialTags,
    requirement: initialRequirement,
    coverage: initialCoverage,
    tests: initialTests
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [tags, setTags] = React.useState<TagPrimary[] | null>(initialTags)
  const [requirement, setRequirement] =
    React.useState<RequirementPrimary | null>(initialRequirement)
  const [coverage, setCoverage] = React.useState<CoverageTertiary | null>(
    initialCoverage
  )
  const [tests, setTests] = React.useState<TestPrimary[] | null>(initialTests)

  const tagIds = React.useMemo(() => coverage?.tagIds ?? null, [coverage])
  const testIds = React.useMemo(() => coverage?.testIds ?? null, [coverage])

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useRequirementSubscription(
    'PRIMARY_PROPS',
    coverage?.requirementId ?? null,
    setRequirement
  )
  useCoverageSubscription('UP_TO_TERTIARY_PROPS', coverageId, setCoverage)
  useTestsFilteredSubscription('PRIMARY_PROPS', testIds, setTests)

  React.useEffect(() => {
    if (coverageId === null) {
      notifier.showError(
        'указан некорректный идентификатор покрытия требования в URL'
      )
    } else if (
      coverage === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_COVERAGE')
    ) {
      notifier.showError(
        `не удалось загрузить покрытие требования с идентификатором ${coverageId}`
      )
    }
  }, [coverageId, coverage, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COVERAGE') === false ? (
    <ForbiddenScreen />
  ) : coverageId !== null && coverage !== null ? (
    <CoverageViewer
      key={coverageId}
      tags={tags}
      requirement={requirement}
      coverage={coverage}
      tests={tests}
    />
  ) : null
}

export default function CoverageRoute(props: Route.ComponentProps) {
  return <CoverageRouteInner key={props.loaderData.coverageId} {...props} />
}
