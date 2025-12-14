// Project
import type { DocumentSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readDocumentsSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useDocumentsSubscription } from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { DocumentsScreen } from '~/components/screens/documents'
// React router
import type { Route } from './+types/documents'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [documents] = await Promise.all([readDocumentsSecondary()])
  return {
    documents
  }
}

export default function DocumentsRoute({
  loaderData: { documents: initialDocuments }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [documents, setDocuments] = React.useState<DocumentSecondary[] | null>(
    initialDocuments
  )

  useDocumentsSubscription('UP_TO_SECONDARY_PROPS', setDocuments)

  React.useEffect(() => {
    if (
      documents === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_DOCUMENT')
    ) {
      notifier.showError('не удалось загрузить список документов')
    }
  }, [documents, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DOCUMENT') === false ? (
    <ForbiddenScreen />
  ) : documents !== null ? (
    <DocumentsScreen documents={documents}>
      {outlet !== null ? outlet : null}
    </DocumentsScreen>
  ) : null
}
