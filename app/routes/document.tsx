// Project
import type { TagPrimary, DocumentTertiary, FragmentPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTagsPrimaryFiltered,
  readDocumentTertiary,
  readFragmentsPrimaryFiltered
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useDocumentSubscription,
  useFragmentsFilteredSubscription
} from '~/hooks/resources'
import { DocumentViewer } from '~/components/single-resource-viewers/resources/document'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/document'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const documentId = (() => {
    const parsed = parseInt(params.documentId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [document] = await Promise.all([readDocumentTertiary(documentId)])
  const [tags, fragments] = await Promise.all([
    readTagsPrimaryFiltered(document?.tagIds ?? null),
    readFragmentsPrimaryFiltered(document?.fragmentIds ?? null)
  ])
  return {
    documentId,
    tags,
    document,
    fragments
  }
}

function DocumentRouteInner({
  loaderData: {
    documentId,
    tags: initialTags,
    document: initialDocument,
    fragments: initialFragments
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [tags, setTags] = React.useState<TagPrimary[] | null>(initialTags)
  const [document, setDocument] = React.useState<DocumentTertiary | null>(
    initialDocument
  )
  const [fragments, setFragments] = React.useState<FragmentPrimary[] | null>(
    initialFragments
  )

  const tagIds = React.useMemo(() => document?.tagIds ?? null, [document])
  const fragmentIds = React.useMemo(
    () => document?.fragmentIds ?? null,
    [document]
  )

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useDocumentSubscription('UP_TO_TERTIARY_PROPS', documentId, setDocument)
  useFragmentsFilteredSubscription('PRIMARY_PROPS', fragmentIds, setFragments)

  React.useEffect(() => {
    if (documentId === null) {
      notifier.showError('указан некорректный идентификатор документа в URL')
    } else if (
      document === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_DOCUMENT')
    ) {
      notifier.showError(
        `не удалось загрузить документ с идентификатором ${documentId}`
      )
    }
  }, [documentId, document, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DOCUMENT') === false ? (
    <ForbiddenScreen />
  ) : documentId !== null && document !== null ? (
    <DocumentViewer
      key={documentId}
      tags={tags}
      document={document}
      fragments={fragments}
    />
  ) : null
}

export default function DocumentRoute(props: Route.ComponentProps) {
  return <DocumentRouteInner key={props.loaderData.documentId} {...props} />
}
