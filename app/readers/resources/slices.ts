// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readSlicesPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SLICE')
    ? serverConnector
        .readSlices({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSlicesSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SLICE')
    ? serverConnector
        .readSlices({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readSlicesPrimaryFiltered(sliceIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SLICE') &&
    sliceIds !== null
    ? sliceIds.length === 0
      ? []
      : serverConnector
          .readSlices({
            ids: sliceIds,
            scope: 'PRIMARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

export function readSlicesSecondaryFiltered(sliceIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SLICE') &&
    sliceIds !== null
    ? sliceIds.length === 0
      ? []
      : serverConnector
          .readSlices({
            ids: sliceIds,
            scope: 'UP_TO_SECONDARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readSlicePrimary(sliceId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SLICE') &&
    sliceId !== null
    ? serverConnector
        .readSlice(
          {
            id: sliceId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSliceSecondary(sliceId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SLICE') &&
    sliceId !== null
    ? serverConnector
        .readSlice(
          {
            id: sliceId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSliceTertiary(sliceId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SLICE') &&
    sliceId !== null
    ? serverConnector
        .readSlice(
          {
            id: sliceId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSliceAll(sliceId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SLICE') &&
    sliceId !== null
    ? serverConnector
        .readSlice(
          {
            id: sliceId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readSliceVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SLICE') &&
    params !== null
    ? serverConnector.readSliceVersion(params).catch(() => null)
    : Promise.resolve(null)
}
