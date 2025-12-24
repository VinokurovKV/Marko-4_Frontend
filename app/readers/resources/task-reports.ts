// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readTaskReportsPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_REPORT')
    ? serverConnector
        .readTaskReports({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTaskReportsSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_REPORT')
    ? serverConnector
        .readTaskReports({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readTaskReportsPrimaryFiltered(taskReportIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_REPORT') &&
    taskReportIds !== null
    ? serverConnector
        .readTaskReports({
          ids: taskReportIds,
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTaskReportsSecondaryFiltered(
  taskReportIds: number[] | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_REPORT') &&
    taskReportIds !== null
    ? serverConnector
        .readTaskReports({
          ids: taskReportIds,
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readTaskReportPrimary(taskReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_REPORT') &&
    taskReportId !== null
    ? serverConnector
        .readTaskReport(
          {
            id: taskReportId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTaskReportSecondary(taskReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_REPORT') &&
    taskReportId !== null
    ? serverConnector
        .readTaskReport(
          {
            id: taskReportId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTaskReportTertiary(taskReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_REPORT') &&
    taskReportId !== null
    ? serverConnector
        .readTaskReport(
          {
            id: taskReportId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTaskReportAll(taskReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_REPORT') &&
    taskReportId !== null
    ? serverConnector
        .readTaskReport(
          {
            id: taskReportId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one for task

export async function readTaskReportPrimaryForTask(taskId: number | null) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_REPORT') &&
    taskId !== null
  ) {
    try {
      const taskReports = await serverConnector.readTaskReports({
        taskIds: [taskId],
        scope: 'PRIMARY_PROPS'
      })
      return taskReports.length === 1 ? taskReports[0] : null
    } catch {
      return null
    }
  } else {
    return Promise.resolve(null)
  }
}

export async function readTaskReportSecondaryForTask(taskId: number | null) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_REPORT') &&
    taskId !== null
  ) {
    try {
      const taskReports = await serverConnector.readTaskReports({
        taskIds: [taskId],
        scope: 'UP_TO_SECONDARY_PROPS'
      })
      return taskReports.length === 1 ? taskReports[0] : null
    } catch {
      return null
    }
  } else {
    return Promise.resolve(null)
  }
}

export async function readTaskReportTertiaryForTask(taskId: number | null) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_REPORT') &&
    taskId !== null
  ) {
    try {
      const taskReports = await serverConnector.readTaskReports({
        taskIds: [taskId],
        scope: 'PRIMARY_PROPS'
      })
      const taskReport = taskReports.length === 1 ? taskReports[0] : null
      return taskReport !== null
        ? await serverConnector.readTaskReport(
            {
              id: taskReport.id
            },
            {
              scope: 'UP_TO_TERTIARY_PROPS'
            }
          )
        : null
    } catch {
      return null
    }
  } else {
    return Promise.resolve(null)
  }
}

export async function readTaskReportAllForTask(taskId: number | null) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TASK_REPORT') &&
    taskId !== null
  ) {
    try {
      const taskReports = await serverConnector.readTaskReports({
        taskIds: [taskId],
        scope: 'PRIMARY_PROPS'
      })
      const taskReport = taskReports.length === 1 ? taskReports[0] : null
      return taskReport !== null
        ? await serverConnector.readTaskReport(
            {
              id: taskReport.id
            },
            {
              scope: 'ALL_PROPS'
            }
          )
        : null
    } catch {
      return null
    }
  } else {
    return Promise.resolve(null)
  }
}
