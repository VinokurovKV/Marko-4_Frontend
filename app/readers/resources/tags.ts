// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readTagsPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TAG')
    ? serverConnector
        .readTags({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTagsSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TAG')
    ? serverConnector
        .readTags({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readTagsPrimaryFiltered(tagIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TAG') &&
    tagIds !== null
    ? tagIds.length === 0
      ? []
      : serverConnector
          .readTags({
            ids: tagIds,
            scope: 'PRIMARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

export function readTagsSecondaryFiltered(tagIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TAG') &&
    tagIds !== null
    ? tagIds.length === 0
      ? []
      : serverConnector
          .readTags({
            ids: tagIds,
            scope: 'UP_TO_SECONDARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readTagPrimary(tagId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TAG') &&
    tagId !== null
    ? serverConnector
        .readTag(
          {
            id: tagId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTagSecondary(tagId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TAG') &&
    tagId !== null
    ? serverConnector
        .readTag(
          {
            id: tagId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTagTertiary(tagId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TAG') &&
    tagId !== null
    ? serverConnector
        .readTag(
          {
            id: tagId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTagAll(tagId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TAG') &&
    tagId !== null
    ? serverConnector
        .readTag(
          {
            id: tagId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readTagVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TAG') &&
    params !== null
    ? serverConnector.readTagVersion(params).catch(() => null)
    : Promise.resolve(null)
}
