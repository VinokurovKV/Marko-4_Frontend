// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readTasksPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK')
    ? serverConnector
        .readTasks({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTasksSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK')
    ? serverConnector
        .readTasks({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readTasksPrimaryFiltered(taskIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK') &&
    taskIds !== null
    ? taskIds.length === 0
      ? []
      : serverConnector
          .readTasks({
            ids: taskIds,
            scope: 'PRIMARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

export function readTasksSecondaryFiltered(taskIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK') &&
    taskIds !== null
    ? taskIds.length === 0
      ? []
      : serverConnector
          .readTasks({
            ids: taskIds,
            scope: 'UP_TO_SECONDARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readTaskPrimary(taskId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK') &&
    taskId !== null
    ? serverConnector
        .readTask(
          {
            id: taskId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTaskSecondary(taskId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK') &&
    taskId !== null
    ? serverConnector
        .readTask(
          {
            id: taskId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTaskTertiary(taskId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK') &&
    taskId !== null
    ? serverConnector
        .readTask(
          {
            id: taskId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTaskAll(taskId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK') &&
    taskId !== null
    ? serverConnector
        .readTask(
          {
            id: taskId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readTaskVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK') &&
    params !== null
    ? serverConnector.readTaskVersion(params).catch(() => null)
    : Promise.resolve(null)
}
