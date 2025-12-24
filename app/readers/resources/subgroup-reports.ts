// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readSubgroupReportsPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT')
    ? serverConnector
        .readSubgroupReports({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSubgroupReportsSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT')
    ? serverConnector
        .readSubgroupReports({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readSubgroupReportsPrimaryFiltered(
  subgroupReportIds: number[] | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT') &&
    subgroupReportIds !== null
    ? serverConnector
        .readSubgroupReports({
          ids: subgroupReportIds,
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSubgroupReportsSecondaryFiltered(
  subgroupReportIds: number[] | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT') &&
    subgroupReportIds !== null
    ? serverConnector
        .readSubgroupReports({
          ids: subgroupReportIds,
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many for task

export function readSubgroupReportsPrimaryForTask(taskId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT') &&
    taskId !== null
    ? serverConnector
        .readSubgroupReports({
          taskIds: [taskId],
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSubgroupReportsSecondaryForTask(taskId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT') &&
    taskId !== null
    ? serverConnector
        .readSubgroupReports({
          taskIds: [taskId],
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readSubgroupReportPrimary(subgroupReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT') &&
    subgroupReportId !== null
    ? serverConnector
        .readSubgroupReport(
          {
            id: subgroupReportId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSubgroupReportSecondary(subgroupReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT') &&
    subgroupReportId !== null
    ? serverConnector
        .readSubgroupReport(
          {
            id: subgroupReportId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSubgroupReportTertiary(subgroupReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT') &&
    subgroupReportId !== null
    ? serverConnector
        .readSubgroupReport(
          {
            id: subgroupReportId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readSubgroupReportAll(subgroupReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT') &&
    subgroupReportId !== null
    ? serverConnector
        .readSubgroupReport(
          {
            id: subgroupReportId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one for task and subgroup

export async function readSubgroupReportPrimaryForTaskAndSubgroup(
  taskId: number | null,
  subgroupId: number | null
) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT') &&
    taskId !== null &&
    subgroupId !== null
  ) {
    try {
      const subgroupReports = await serverConnector.readSubgroupReports({
        taskIds: [taskId],
        subgroupIds: [subgroupId],
        scope: 'PRIMARY_PROPS'
      })
      return subgroupReports.length === 1 ? subgroupReports[0] : null
    } catch {
      return null
    }
  } else {
    return Promise.resolve(null)
  }
}

export async function readSubgroupReportSecondaryForTaskAndSubgroup(
  taskId: number | null,
  subgroupId: number | null
) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT') &&
    taskId !== null &&
    subgroupId !== null
  ) {
    try {
      const subgroupReports = await serverConnector.readSubgroupReports({
        taskIds: [taskId],
        subgroupIds: [subgroupId],
        scope: 'UP_TO_SECONDARY_PROPS'
      })
      return subgroupReports.length === 1 ? subgroupReports[0] : null
    } catch {
      return null
    }
  } else {
    return Promise.resolve(null)
  }
}

export async function readSubgroupReportTertiaryForTaskAndSubgroup(
  taskId: number | null,
  subgroupId: number | null
) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT') &&
    taskId !== null &&
    subgroupId !== null
  ) {
    try {
      const subgroupReports = await serverConnector.readSubgroupReports({
        taskIds: [taskId],
        subgroupIds: [subgroupId],
        scope: 'PRIMARY_PROPS'
      })
      const subgroupReport =
        subgroupReports.length === 1 ? subgroupReports[0] : null
      return subgroupReport !== null
        ? await serverConnector.readSubgroupReport(
            {
              id: subgroupReport.id
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

export async function readSubgroupReportAllForTaskAndSubgroup(
  taskId: number | null,
  subgroupId: number | null
) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP_REPORT') &&
    taskId !== null &&
    subgroupId !== null
  ) {
    try {
      const subgroupReports = await serverConnector.readSubgroupReports({
        taskIds: [taskId],
        subgroupIds: [subgroupId],
        scope: 'PRIMARY_PROPS'
      })
      const subgroupReport =
        subgroupReports.length === 1 ? subgroupReports[0] : null
      return subgroupReport !== null
        ? await serverConnector.readSubgroupReport(
            {
              id: subgroupReport.id
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
