// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readTestTemplatesPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_TEMPLATE')
    ? serverConnector
        .readTestTemplates({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestTemplatesSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_TEMPLATE')
    ? serverConnector
        .readTestTemplates({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readTestTemplatesPrimaryFiltered(
  testTemplateIds: number[] | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_TEMPLATE') &&
    testTemplateIds !== null
    ? testTemplateIds.length === 0
      ? []
      : serverConnector
          .readTestTemplates({
            ids: testTemplateIds,
            scope: 'PRIMARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

export function readTestTemplatesSecondaryFiltered(
  testTemplateIds: number[] | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_TEMPLATE') &&
    testTemplateIds !== null
    ? testTemplateIds.length === 0
      ? []
      : serverConnector
          .readTestTemplates({
            ids: testTemplateIds,
            scope: 'UP_TO_SECONDARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readTestTemplatePrimary(testTemplateId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_TEMPLATE') &&
    testTemplateId !== null
    ? serverConnector
        .readTestTemplate(
          {
            id: testTemplateId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestTemplateSecondary(testTemplateId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_TEMPLATE') &&
    testTemplateId !== null
    ? serverConnector
        .readTestTemplate(
          {
            id: testTemplateId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestTemplateTertiary(testTemplateId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_TEMPLATE') &&
    testTemplateId !== null
    ? serverConnector
        .readTestTemplate(
          {
            id: testTemplateId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestTemplateAll(testTemplateId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_TEMPLATE') &&
    testTemplateId !== null
    ? serverConnector
        .readTestTemplate(
          {
            id: testTemplateId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readTestTemplateVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_TEMPLATE') &&
    params !== null
    ? serverConnector.readTestTemplateVersion(params).catch(() => null)
    : Promise.resolve(null)
}
