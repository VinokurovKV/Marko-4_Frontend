// Project
import type { TestPrimary, TestReportSecondary } from '~/types'
import { Grid } from '../grid'
import {
  useTestReportHeaderCol,
  useTestStatusCol,
  useLaunchTimeCol,
  useFinishTimeCol
} from '../cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

export interface TestReportsGridProps {
  tests: TestPrimary[]
  testReports: TestReportSecondary[]
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function TestReportsGrid(props: TestReportsGridProps) {
  const navigationMode = props.navigationMode ?? false
  const navigate = useNavigate()
  const rows: GridValidRowModel[] = props.testReports

  const testReportForId = React.useMemo(
    () =>
      new Map(
        props.testReports.map((testReport) => [testReport.id, testReport])
      ),
    [props.testReports]
  )

  const readCols = [
    useTestReportHeaderCol(props.tests, navigationMode),
    useTestStatusCol(),
    useLaunchTimeCol(),
    useFinishTimeCol()
  ]

  const navigationModeReadCols = React.useMemo(
    () => [readCols[0], readCols[1]],
    [readCols]
  )

  const cols: GridColDef[] = React.useMemo(
    () => (navigationMode ? navigationModeReadCols : [...readCols]),
    [navigationMode, readCols, navigationModeReadCols]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof TestReportSecondary)[],
    []
  )

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      const testReport = testReportForId.get(rowId)
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/tasks/${testReport?.taskId}/${testReport?.testId}`
          : `/tasks/${testReport?.taskId}`
      )
    },
    [props.navigationModeSelectedRowId, navigate, testReportForId]
  )

  return (
    <>
      <Grid
        localSaveKey="TEST_REPORTS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
        selectedRowId={
          navigationMode ? props.navigationModeSelectedRowId : undefined
        }
        navigationModeOnRowClick={handleNavigationModeRowClick}
        compactFooter={navigationMode}
      />
    </>
  )
}
