// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readDocumentsPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DOCUMENT')
    ? serverConnector
        .readDocuments({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDocumentsSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DOCUMENT')
    ? serverConnector
        .readDocuments({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readDocumentsPrimaryFiltered(documentIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DOCUMENT') &&
    documentIds !== null
    ? serverConnector
        .readDocuments({
          ids: documentIds,
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDocumentsSecondaryFiltered(documentIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DOCUMENT') &&
    documentIds !== null
    ? serverConnector
        .readDocuments({
          ids: documentIds,
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readDocumentPrimary(documentId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DOCUMENT') &&
    documentId !== null
    ? serverConnector
        .readDocument(
          {
            id: documentId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDocumentSecondary(documentId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DOCUMENT') &&
    documentId !== null
    ? serverConnector
        .readDocument(
          {
            id: documentId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDocumentTertiary(documentId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DOCUMENT') &&
    documentId !== null
    ? serverConnector
        .readDocument(
          {
            id: documentId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDocumentAll(documentId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DOCUMENT') &&
    documentId !== null
    ? serverConnector
        .readDocument(
          {
            id: documentId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readDocumentVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DOCUMENT') &&
    params !== null
    ? serverConnector.readDocumentVersion(params).catch(() => null)
    : Promise.resolve(null)
}
