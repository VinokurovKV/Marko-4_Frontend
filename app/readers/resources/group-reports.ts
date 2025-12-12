// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readGroupReportsPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT')
    ? serverConnector
        .readGroupReports({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readGroupReportsSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT')
    ? serverConnector
        .readGroupReports({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readGroupReportsPrimaryFiltered(
  groupReportIds: number[] | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT') &&
    groupReportIds !== null
    ? groupReportIds.length === 0
      ? []
      : serverConnector
          .readGroupReports({
            ids: groupReportIds,
            scope: 'PRIMARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

export function readGroupReportsSecondaryFiltered(
  groupReportIds: number[] | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT') &&
    groupReportIds !== null
    ? groupReportIds.length === 0
      ? []
      : serverConnector
          .readGroupReports({
            ids: groupReportIds,
            scope: 'UP_TO_SECONDARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

// Read many for task

export function readGroupReportsPrimaryForTask(taskId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT') &&
    taskId !== null
    ? serverConnector
        .readGroupReports({
          taskIds: [taskId],
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readGroupReportsSecondaryForTask(taskId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT') &&
    taskId !== null
    ? serverConnector
        .readGroupReports({
          taskIds: [taskId],
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readGroupReportPrimary(groupReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT') &&
    groupReportId !== null
    ? serverConnector
        .readGroupReport(
          {
            id: groupReportId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readGroupReportSecondary(groupReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT') &&
    groupReportId !== null
    ? serverConnector
        .readGroupReport(
          {
            id: groupReportId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readGroupReportTertiary(groupReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT') &&
    groupReportId !== null
    ? serverConnector
        .readGroupReport(
          {
            id: groupReportId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readGroupReportAll(groupReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT') &&
    groupReportId !== null
    ? serverConnector
        .readGroupReport(
          {
            id: groupReportId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one for task and group

export async function readGroupReportPrimaryForTaskAndGroup(
  taskId: number | null,
  groupId: number | null
) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT') &&
    taskId !== null &&
    groupId !== null
  ) {
    try {
      const groupReports = await serverConnector.readGroupReports({
        taskIds: [taskId],
        groupIds: [groupId],
        scope: 'PRIMARY_PROPS'
      })
      return groupReports.length === 1 ? groupReports[0] : null
    } catch {
      return null
    }
  } else {
    return Promise.resolve(null)
  }
}

export async function readGroupReportSecondaryForTaskAndGroup(
  taskId: number | null,
  groupId: number | null
) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT') &&
    taskId !== null &&
    groupId !== null
  ) {
    try {
      const groupReports = await serverConnector.readGroupReports({
        taskIds: [taskId],
        groupIds: [groupId],
        scope: 'UP_TO_SECONDARY_PROPS'
      })
      return groupReports.length === 1 ? groupReports[0] : null
    } catch {
      return null
    }
  } else {
    return Promise.resolve(null)
  }
}

export async function readGroupReportTertiaryForTaskAndGroup(
  taskId: number | null,
  groupId: number | null
) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT') &&
    taskId !== null &&
    groupId !== null
  ) {
    try {
      const groupReports = await serverConnector.readGroupReports({
        taskIds: [taskId],
        groupIds: [groupId],
        scope: 'PRIMARY_PROPS'
      })
      const groupReport = groupReports.length === 1 ? groupReports[0] : null
      return groupReport !== null
        ? await serverConnector.readGroupReport(
            {
              id: groupReport.id
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

export async function readGroupReportAllForTaskAndGroup(
  taskId: number | null,
  groupId: number | null
) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP_REPORT') &&
    taskId !== null &&
    groupId !== null
  ) {
    try {
      const groupReports = await serverConnector.readGroupReports({
        taskIds: [taskId],
        groupIds: [groupId],
        scope: 'PRIMARY_PROPS'
      })
      const groupReport = groupReports.length === 1 ? groupReports[0] : null
      return groupReport !== null
        ? await serverConnector.readGroupReport(
            {
              id: groupReport.id
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
