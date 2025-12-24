// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readCommonTopologiesPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COMMON_TOPOLOGY')
    ? serverConnector
        .readCommonTopologies({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readCommonTopologiesSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COMMON_TOPOLOGY')
    ? serverConnector
        .readCommonTopologies({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readCommonTopologiesPrimaryFiltered(
  commonTopologyIds: number[] | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COMMON_TOPOLOGY') &&
    commonTopologyIds !== null
    ? serverConnector
        .readCommonTopologies({
          ids: commonTopologyIds,
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readCommonTopologiesSecondaryFiltered(
  commonTopologyIds: number[] | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COMMON_TOPOLOGY') &&
    commonTopologyIds !== null
    ? serverConnector
        .readCommonTopologies({
          ids: commonTopologyIds,
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readCommonTopologyPrimary(commonTopologyId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COMMON_TOPOLOGY') &&
    commonTopologyId !== null
    ? serverConnector
        .readCommonTopology(
          {
            id: commonTopologyId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readCommonTopologySecondary(commonTopologyId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COMMON_TOPOLOGY') &&
    commonTopologyId !== null
    ? serverConnector
        .readCommonTopology(
          {
            id: commonTopologyId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readCommonTopologyTertiary(commonTopologyId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COMMON_TOPOLOGY') &&
    commonTopologyId !== null
    ? serverConnector
        .readCommonTopology(
          {
            id: commonTopologyId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readCommonTopologyAll(commonTopologyId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COMMON_TOPOLOGY') &&
    commonTopologyId !== null
    ? serverConnector
        .readCommonTopology(
          {
            id: commonTopologyId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readCommonTopologyVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COMMON_TOPOLOGY') &&
    params !== null
    ? serverConnector.readCommonTopologyVersion(params).catch(() => null)
    : Promise.resolve(null)
}
