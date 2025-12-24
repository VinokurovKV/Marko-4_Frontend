// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readSubgroupsPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP')
    ? serverConnector
        .readSubgroups({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSubgroupsSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP')
    ? serverConnector
        .readSubgroups({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readSubgroupsPrimaryFiltered(subgroupIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP') &&
    subgroupIds !== null
    ? serverConnector
        .readSubgroups({
          ids: subgroupIds,
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSubgroupsSecondaryFiltered(subgroupIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP') &&
    subgroupIds !== null
    ? serverConnector
        .readSubgroups({
          ids: subgroupIds,
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readSubgroupPrimary(subgroupId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP') &&
    subgroupId !== null
    ? serverConnector
        .readSubgroup(
          {
            id: subgroupId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSubgroupSecondary(subgroupId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP') &&
    subgroupId !== null
    ? serverConnector
        .readSubgroup(
          {
            id: subgroupId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSubgroupTertiary(subgroupId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP') &&
    subgroupId !== null
    ? serverConnector
        .readSubgroup(
          {
            id: subgroupId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSubgroupAll(subgroupId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP') &&
    subgroupId !== null
    ? serverConnector
        .readSubgroup(
          {
            id: subgroupId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readSubgroupVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP') &&
    params !== null
    ? serverConnector.readSubgroupVersion(params).catch(() => null)
    : Promise.resolve(null)
}
