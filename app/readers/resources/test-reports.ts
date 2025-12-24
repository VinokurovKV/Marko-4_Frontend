// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readTestReportsPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT')
    ? serverConnector
        .readTestReports({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestReportsSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT')
    ? serverConnector
        .readTestReports({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readTestReportsPrimaryFiltered(testReportIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') &&
    testReportIds !== null
    ? serverConnector
        .readTestReports({
          ids: testReportIds,
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestReportsSecondaryFiltered(
  testReportIds: number[] | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') &&
    testReportIds !== null
    ? serverConnector
        .readTestReports({
          ids: testReportIds,
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many for task

export function readTestReportsPrimaryForTask(taskId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') &&
    taskId !== null
    ? serverConnector
        .readTestReports({
          taskIds: [taskId],
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestReportsSecondaryForTask(taskId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') &&
    taskId !== null
    ? serverConnector
        .readTestReports({
          taskIds: [taskId],
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readTestReportPrimary(testReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') &&
    testReportId !== null
    ? serverConnector
        .readTestReport(
          {
            id: testReportId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestReportSecondary(testReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') &&
    testReportId !== null
    ? serverConnector
        .readTestReport(
          {
            id: testReportId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestReportTertiary(testReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') &&
    testReportId !== null
    ? serverConnector
        .readTestReport(
          {
            id: testReportId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readTestReportAll(testReportId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') &&
    testReportId !== null
    ? serverConnector
        .readTestReport(
          {
            id: testReportId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one for task and test

export async function readTestReportPrimaryForTaskAndTest(
  taskId: number | null,
  testId: number | null
) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') &&
    taskId !== null &&
    testId !== null
  ) {
    try {
      const testReports = await serverConnector.readTestReports({
        taskIds: [taskId],
        testIds: [testId],
        scope: 'PRIMARY_PROPS'
      })
      return testReports.length === 1 ? testReports[0] : null
    } catch {
      return null
    }
  } else {
    return Promise.resolve(null)
  }
}

export async function readTestReportSecondaryForTaskAndTest(
  taskId: number | null,
  testId: number | null
) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') &&
    taskId !== null &&
    testId !== null
  ) {
    try {
      const testReports = await serverConnector.readTestReports({
        taskIds: [taskId],
        testIds: [testId],
        scope: 'UP_TO_SECONDARY_PROPS'
      })
      return testReports.length === 1 ? testReports[0] : null
    } catch {
      return null
    }
  } else {
    return Promise.resolve(null)
  }
}

export async function readTestReportTertiaryForTaskAndTest(
  taskId: number | null,
  testId: number | null
) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') &&
    taskId !== null &&
    testId !== null
  ) {
    try {
      const testReports = await serverConnector.readTestReports({
        taskIds: [taskId],
        testIds: [testId],
        scope: 'PRIMARY_PROPS'
      })
      const testReport = testReports.length === 1 ? testReports[0] : null
      return testReport !== null
        ? await serverConnector.readTestReport(
            {
              id: testReport.id
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

export async function readTestReportAllForTaskAndTest(
  taskId: number | null,
  testId: number | null
) {
  const meta = serverConnector.meta
  if (
    meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_REPORT') &&
    taskId !== null &&
    testId !== null
  ) {
    try {
      const testReports = await serverConnector.readTestReports({
        taskIds: [taskId],
        testIds: [testId],
        scope: 'PRIMARY_PROPS'
      })
      const testReport = testReports.length === 1 ? testReports[0] : null
      return testReport !== null
        ? await serverConnector.readTestReport(
            {
              id: testReport.id
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
