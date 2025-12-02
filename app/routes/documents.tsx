// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { DocumentsScreen } from '~/components/screens/documents'
// React router
import type { Route } from './+types/documents'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [documents] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_DOCUMENT')
          ? serverConnector
              .readDocuments({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    documents
  }
}

export default function MetaRoute({
  loaderData: { documents }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

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
  ) : (
    <DocumentsScreen initialDocuments={documents ?? []} />
  )
}
