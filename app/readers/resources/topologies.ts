// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readTopologiesPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TOPOLOGY')
    ? serverConnector
        .readTopologies({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTopologiesSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TOPOLOGY')
    ? serverConnector
        .readTopologies({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readTopologiesPrimaryFiltered(topologyIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TOPOLOGY') &&
    topologyIds !== null
    ? topologyIds.length === 0
      ? []
      : serverConnector
          .readTopologies({
            ids: topologyIds,
            scope: 'PRIMARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

export function readTopologiesSecondaryFiltered(topologyIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TOPOLOGY') &&
    topologyIds !== null
    ? topologyIds.length === 0
      ? []
      : serverConnector
          .readTopologies({
            ids: topologyIds,
            scope: 'UP_TO_SECONDARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readTopologyPrimary(topologyId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TOPOLOGY') &&
    topologyId !== null
    ? serverConnector
        .readTopology(
          {
            id: topologyId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTopologySecondary(topologyId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TOPOLOGY') &&
    topologyId !== null
    ? serverConnector
        .readTopology(
          {
            id: topologyId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTopologyTertiary(topologyId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TOPOLOGY') &&
    topologyId !== null
    ? serverConnector
        .readTopology(
          {
            id: topologyId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTopologyAll(topologyId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TOPOLOGY') &&
    topologyId !== null
    ? serverConnector
        .readTopology(
          {
            id: topologyId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readTopologyVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TOPOLOGY') &&
    params !== null
    ? serverConnector.readTopologyVersion(params).catch(() => null)
    : Promise.resolve(null)
}
