// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readTaskTemplatesPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_TEMPLATE')
    ? serverConnector
        .readTaskTemplates({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTaskTemplatesSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_TEMPLATE')
    ? serverConnector
        .readTaskTemplates({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readTaskTemplatesPrimaryFiltered(
  taskTemplateIds: number[] | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_TEMPLATE') &&
    taskTemplateIds !== null
    ? taskTemplateIds.length === 0
      ? []
      : serverConnector
          .readTaskTemplates({
            ids: taskTemplateIds,
            scope: 'PRIMARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

export function readTaskTemplatesSecondaryFiltered(
  taskTemplateIds: number[] | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_TEMPLATE') &&
    taskTemplateIds !== null
    ? taskTemplateIds.length === 0
      ? []
      : serverConnector
          .readTaskTemplates({
            ids: taskTemplateIds,
            scope: 'UP_TO_SECONDARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readTaskTemplatePrimary(taskTemplateId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_TEMPLATE') &&
    taskTemplateId !== null
    ? serverConnector
        .readTaskTemplate(
          {
            id: taskTemplateId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTaskTemplateSecondary(taskTemplateId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_TEMPLATE') &&
    taskTemplateId !== null
    ? serverConnector
        .readTaskTemplate(
          {
            id: taskTemplateId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTaskTemplateTertiary(taskTemplateId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_TEMPLATE') &&
    taskTemplateId !== null
    ? serverConnector
        .readTaskTemplate(
          {
            id: taskTemplateId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTaskTemplateAll(taskTemplateId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_TEMPLATE') &&
    taskTemplateId !== null
    ? serverConnector
        .readTaskTemplate(
          {
            id: taskTemplateId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readTaskTemplateVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_TEMPLATE') &&
    params !== null
    ? serverConnector.readTaskTemplateVersion(params).catch(() => null)
    : Promise.resolve(null)
}
