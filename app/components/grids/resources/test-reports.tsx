// Project
import type { ReadTestWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { ReadTaskWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/tasks.dto'
import type { ReadTestReportsWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/test-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { Grid } from '../grid'
import {
  useFlatTestVersionCol,
  useTestStatusCol,
  useLaunchTimeCol,
  useFinishTimeCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

type Test = DtoWithoutEnums<ReadTestWithPrimaryPropsSuccessResultDto>
type Task = DtoWithoutEnums<ReadTaskWithUpToTertiaryPropsSuccessResultDto>
type TestReport =
  DtoWithoutEnums<ReadTestReportsWithUpToSecondaryPropsSuccessResultItemDto>

export interface TestReportsGridProps {
  tests: Test[]
  task: Task
  testReports: TestReport[]
}

export function TestReportsGrid(props: TestReportsGridProps) {
  const rows: GridValidRowModel[] = props.testReports

  const readCols = [
    useFlatTestVersionCol(props.tests, props.task),
    useTestStatusCol(),
    useLaunchTimeCol(),
    useFinishTimeCol()
  ]

  const cols: GridColDef[] = React.useMemo(() => [...readCols], [readCols])

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof TestReport)[],
    []
  )

  return (
    <>
      <Grid
        localSaveKey="TEST_REPORTS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={false}
      />
    </>
  )
}
