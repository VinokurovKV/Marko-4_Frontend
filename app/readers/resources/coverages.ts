// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readCoveragesPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COVERAGE')
    ? serverConnector
        .readCoverages({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readCoveragesSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COVERAGE')
    ? serverConnector
        .readCoverages({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readCoveragesPrimaryFiltered(coverageIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COVERAGE') &&
    coverageIds !== null
    ? serverConnector
        .readCoverages({
          ids: coverageIds,
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readCoveragesSecondaryFiltered(coverageIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COVERAGE') &&
    coverageIds !== null
    ? serverConnector
        .readCoverages({
          ids: coverageIds,
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readCoveragePrimary(coverageId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COVERAGE') &&
    coverageId !== null
    ? serverConnector
        .readCoverage(
          {
            id: coverageId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readCoverageSecondary(coverageId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COVERAGE') &&
    coverageId !== null
    ? serverConnector
        .readCoverage(
          {
            id: coverageId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readCoverageTertiary(coverageId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COVERAGE') &&
    coverageId !== null
    ? serverConnector
        .readCoverage(
          {
            id: coverageId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readCoverageAll(coverageId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COVERAGE') &&
    coverageId !== null
    ? serverConnector
        .readCoverage(
          {
            id: coverageId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readCoverageVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COVERAGE') &&
    params !== null
    ? serverConnector.readCoverageVersion(params).catch(() => null)
    : Promise.resolve(null)
}
