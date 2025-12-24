// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readDsefsPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DSEF')
    ? serverConnector
        .readDsefs({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDsefsSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DSEF')
    ? serverConnector
        .readDsefs({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readDsefsPrimaryFiltered(dsefIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DSEF') &&
    dsefIds !== null
    ? serverConnector
        .readDsefs({
          ids: dsefIds,
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDsefsSecondaryFiltered(dsefIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DSEF') &&
    dsefIds !== null
    ? serverConnector
        .readDsefs({
          ids: dsefIds,
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readDsefPrimary(dsefId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DSEF') &&
    dsefId !== null
    ? serverConnector
        .readDsef(
          {
            id: dsefId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDsefSecondary(dsefId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DSEF') &&
    dsefId !== null
    ? serverConnector
        .readDsef(
          {
            id: dsefId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDsefTertiary(dsefId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DSEF') &&
    dsefId !== null
    ? serverConnector
        .readDsef(
          {
            id: dsefId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDsefAll(dsefId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DSEF') &&
    dsefId !== null
    ? serverConnector
        .readDsef(
          {
            id: dsefId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readDsefVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DSEF') &&
    params !== null
    ? serverConnector.readDsefVersion(params).catch(() => null)
    : Promise.resolve(null)
}
