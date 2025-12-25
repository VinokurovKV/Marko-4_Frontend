// Project
import { serverConnector } from '~/server-connector'
import type { TestsFilter } from '~/types'

// Read many

export function readTestsPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST')
    ? serverConnector
        .readTests({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestsSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST')
    ? serverConnector
        .readTests({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readTestsPrimaryFiltered(
  testIds?: number[] | null,
  extraFilter?: TestsFilter
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST') &&
    testIds !== null
    ? serverConnector
        .readTests({
          ids: testIds,
          ...extraFilter,
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestsSecondaryFiltered(
  testIds?: number[] | null,
  extraFilter?: TestsFilter
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST') &&
    testIds !== null
    ? serverConnector
        .readTests({
          ids: testIds,
          ...extraFilter,
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readTestPrimary(testId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST') &&
    testId !== null
    ? serverConnector
        .readTest(
          {
            id: testId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestSecondary(testId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST') &&
    testId !== null
    ? serverConnector
        .readTest(
          {
            id: testId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestTertiary(testId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST') &&
    testId !== null
    ? serverConnector
        .readTest(
          {
            id: testId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestAll(testId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST') &&
    testId !== null
    ? serverConnector
        .readTest(
          {
            id: testId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readTestVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST') &&
    params !== null
    ? serverConnector.readTestVersion(params).catch(() => null)
    : Promise.resolve(null)
}
