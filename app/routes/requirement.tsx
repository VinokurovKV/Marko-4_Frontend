// Project
import type {
  TagPrimary,
  DocumentPrimary,
  FragmentPrimary,
  RequirementPrimary,
  RequirementTertiary,
  CoveragePrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTagsPrimaryFiltered,
  readDocumentsPrimaryFiltered,
  readFragmentsPrimaryFiltered,
  readRequirementsPrimaryFiltered,
  readRequirementTertiary,
  readCoveragesPrimaryFiltered
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useDocumentsFilteredSubscription,
  useFragmentsFilteredSubscription,
  useRequirementsFilteredSubscription,
  useRequirementSubscription,
  useCoveragesFilteredSubscription
} from '~/hooks/resources'
import { RequirementViewer } from '~/components/single-resource-viewers/resources/requirement'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/requirement'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const requirementId = (() => {
    const parsed = parseInt(params.requirementId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [requirement] = await Promise.all([
    readRequirementTertiary(requirementId)
  ])
  const [tags, fragments, parentRequirements, childRequirements, coverages] =
    await Promise.all([
      readTagsPrimaryFiltered(requirement?.tagIds ?? null),
      readFragmentsPrimaryFiltered(requirement?.fragmentIds ?? null),
      readRequirementsPrimaryFiltered(
        requirement?.parentRequirementIds ?? null
      ),
      readRequirementsPrimaryFiltered(requirement?.childRequirementIds ?? null),
      readCoveragesPrimaryFiltered(requirement?.coverageIds ?? null)
    ])
  const documentIds =
    fragments !== null
      ? Array.from(new Set(fragments.map((fragment) => fragment.documentId)))
      : null
  const [documents] = await Promise.all([
    readDocumentsPrimaryFiltered(documentIds)
  ])
  return {
    requirementId,
    tags,
    documents,
    fragments,
    requirement,
    parentRequirements,
    childRequirements,
    coverages
  }
}

function RequirementRouteInner({
  loaderData: {
    requirementId,
    tags: initialTags,
    documents: initialDocuments,
    fragments: initialFragments,
    requirement: initialRequirement,
    parentRequirements: initialParentRequirements,
    childRequirements: initialChildRequirements,
    coverages: initialCoverages
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [tags, setTags] = React.useState<TagPrimary[] | null>(initialTags)
  const [documents, setDocuments] = React.useState<DocumentPrimary[] | null>(
    initialDocuments
  )
  const [fragments, setFragments] = React.useState<FragmentPrimary[] | null>(
    initialFragments
  )
  const [requirement, setRequirement] =
    React.useState<RequirementTertiary | null>(initialRequirement)
  const [parentRequirements, setParentRequirements] = React.useState<
    RequirementPrimary[] | null
  >(initialParentRequirements)
  const [childRequirements, setChildRequirements] = React.useState<
    RequirementPrimary[] | null
  >(initialChildRequirements)
  const [coverages, setCoverages] = React.useState<CoveragePrimary[] | null>(
    initialCoverages
  )

  const tagIds = React.useMemo(() => requirement?.tagIds ?? null, [requirement])
  const documentIds = React.useMemo(
    () =>
      fragments !== null
        ? Array.from(new Set(fragments.map((fragment) => fragment.documentId)))
        : null,
    [fragments]
  )
  const fragmentIds = React.useMemo(
    () => requirement?.fragmentIds ?? null,
    [requirement]
  )
  const parentRequirementIds = React.useMemo(
    () => requirement?.parentRequirementIds ?? null,
    [requirement]
  )
  const childRequirementIds = React.useMemo(
    () => requirement?.childRequirementIds ?? null,
    [requirement]
  )
  const coverageIds = React.useMemo(
    () => requirement?.coverageIds ?? null,
    [requirement]
  )

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useDocumentsFilteredSubscription('PRIMARY_PROPS', documentIds, setDocuments)
  useFragmentsFilteredSubscription('PRIMARY_PROPS', fragmentIds, setFragments)
  useRequirementSubscription(
    'UP_TO_TERTIARY_PROPS',
    requirementId,
    setRequirement
  )
  useRequirementsFilteredSubscription(
    'PRIMARY_PROPS',
    parentRequirementIds,
    setParentRequirements
  )
  useRequirementsFilteredSubscription(
    'PRIMARY_PROPS',
    childRequirementIds,
    setChildRequirements
  )
  useCoveragesFilteredSubscription('PRIMARY_PROPS', coverageIds, setCoverages)

  React.useEffect(() => {
    if (requirementId === null) {
      notifier.showError('указан некорректный идентификатор требования в URL')
    } else if (
      requirement === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_REQUIREMENT')
    ) {
      notifier.showError(
        `не удалось загрузить требование с идентификатором ${requirementId}`
      )
    }
  }, [requirementId, requirement, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT') === false ? (
    <ForbiddenScreen />
  ) : requirementId !== null && requirement !== null ? (
    <RequirementViewer
      key={requirementId}
      tags={tags}
      documents={documents}
      fragments={fragments}
      requirement={requirement}
      parentRequirements={parentRequirements}
      childRequirements={childRequirements}
      coverages={coverages}
    />
  ) : null
}

export default function RequirementRoute(props: Route.ComponentProps) {
  return (
    <RequirementRouteInner key={props.loaderData.requirementId} {...props} />
  )
}
