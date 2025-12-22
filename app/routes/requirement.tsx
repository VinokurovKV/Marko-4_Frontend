// Project
import type {
  TagPrimary,
  DocumentPrimary,
  FragmentPrimary,
  RequirementPrimary,
  RequirementTertiary,
  RequirementsHierarchyVertex,
  TestPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTagsPrimaryFiltered,
  readDocumentsPrimaryFiltered,
  readFragmentsPrimaryFiltered,
  readRequirementsPrimaryFiltered,
  readRequirementTertiary,
  readRequirementsHierarchyVertex,
  readTestPrimary
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useDocumentsFilteredSubscription,
  useFragmentsFilteredSubscription,
  useRequirementsFilteredSubscription,
  useRequirementSubscription,
  useRequirementsHierarchyVertexSubscription,
  useTestSubscription
} from '~/hooks/resources'
import { RequirementViewer } from '~/components/single-resource-viewers/resources/requirement'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/requirement'
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const requirementId = (() => {
    const parsed = parseInt(params.requirementId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [requirement, requirementsHierarchyVertex] = await Promise.all([
    readRequirementTertiary(requirementId),
    readRequirementsHierarchyVertex(requirementId)
  ])
  const [tags, fragments, parentRequirements, childRequirements, test] =
    await Promise.all([
      readTagsPrimaryFiltered(requirement?.tagIds ?? null),
      readFragmentsPrimaryFiltered(requirement?.fragmentIds ?? null),
      readRequirementsPrimaryFiltered(
        requirement?.parentRequirementIds ?? null
      ),
      readRequirementsPrimaryFiltered(requirement?.childRequirementIds ?? null),
      readTestPrimary(requirement?.testId ?? null)
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
    requirementsHierarchyVertex,
    parentRequirements,
    childRequirements,
    test
  }
}

function RequirementRouteInner({
  loaderData: {
    requirementId,
    tags: initialTags,
    documents: initialDocuments,
    fragments: initialFragments,
    requirement: initialRequirement,
    requirementsHierarchyVertex: initialVertex,
    parentRequirements: initialParentRequirements,
    childRequirements: initialChildRequirements,
    test: initialTest
  }
}: Route.ComponentProps) {
  const { pathname } = useLocation()
  const requirementsHierarchyMatch =
    matchPath('/requirements-hierarchy/:requirementId?', pathname) !== null
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
  const [vertex, setVertex] =
    React.useState<RequirementsHierarchyVertex | null>(initialVertex)
  const [parentRequirements, setParentRequirements] = React.useState<
    RequirementPrimary[] | null
  >(initialParentRequirements)
  const [childRequirements, setChildRequirements] = React.useState<
    RequirementPrimary[] | null
  >(initialChildRequirements)
  const [test, setTest] = React.useState<TestPrimary | null>(initialTest)

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

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useDocumentsFilteredSubscription('PRIMARY_PROPS', documentIds, setDocuments)
  useFragmentsFilteredSubscription('PRIMARY_PROPS', fragmentIds, setFragments)
  useRequirementSubscription(
    'UP_TO_TERTIARY_PROPS',
    requirementId,
    setRequirement
  )
  useRequirementsHierarchyVertexSubscription(requirementId, setVertex)
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
  useTestSubscription('PRIMARY_PROPS', requirement?.testId ?? null, setTest)

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
    } else if (
      vertex === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_REQUIREMENT')
    ) {
      notifier.showError(
        `не удалось загрузить вершину иерархии требований с идентификатором ${requirementId}`
      )
    }
  }, [requirementId, requirement, vertex, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT') === false ? (
    <ForbiddenScreen />
  ) : requirementId !== null && requirement !== null && vertex !== null ? (
    <RequirementViewer
      key={requirementId}
      tags={tags}
      documents={documents}
      fragments={fragments}
      requirement={requirement}
      requirementsHierarchyVertex={vertex}
      parentRequirements={parentRequirements}
      childRequirements={childRequirements}
      test={test}
      oneColumn={requirementsHierarchyMatch}
    />
  ) : null
}

export default function RequirementRoute(props: Route.ComponentProps) {
  return (
    <RequirementRouteInner key={props.loaderData.requirementId} {...props} />
  )
}
