// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readDbcsPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DBC')
    ? serverConnector
        .readDbcs({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDbcsSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DBC')
    ? serverConnector
        .readDbcs({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readDbcsPrimaryFiltered(dbcIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DBC') &&
    dbcIds !== null
    ? serverConnector
        .readDbcs({
          ids: dbcIds,
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDbcsSecondaryFiltered(dbcIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DBC') &&
    dbcIds !== null
    ? serverConnector
        .readDbcs({
          ids: dbcIds,
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readDbcPrimary(dbcId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DBC') &&
    dbcId !== null
    ? serverConnector
        .readDbc(
          {
            id: dbcId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDbcSecondary(dbcId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DBC') &&
    dbcId !== null
    ? serverConnector
        .readDbc(
          {
            id: dbcId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDbcTertiary(dbcId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DBC') &&
    dbcId !== null
    ? serverConnector
        .readDbc(
          {
            id: dbcId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDbcAll(dbcId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DBC') &&
    dbcId !== null
    ? serverConnector
        .readDbc(
          {
            id: dbcId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readDbcVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DBC') &&
    params !== null
    ? serverConnector.readDbcVersion(params).catch(() => null)
    : Promise.resolve(null)
}
