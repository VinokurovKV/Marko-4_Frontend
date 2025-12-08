// Project
import type { ReadTestWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { ReadTestReportsWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/test-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { Grid } from '../grid'
import {
  useTestVersionCol,
  useTestStatusCol,
  useLaunchTimeCol,
  useFinishTimeCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

type Test = DtoWithoutEnums<ReadTestWithPrimaryPropsSuccessResultDto>
type TestReport =
  DtoWithoutEnums<ReadTestReportsWithUpToSecondaryPropsSuccessResultItemDto>

export interface TestReportsGridProps {
  tests: Test[]
  testReports: TestReport[]
}

export function TestReportsGrid(props: TestReportsGridProps) {
  const rows: GridValidRowModel[] = props.testReports

  const readCols = [
    useTestVersionCol(props.tests),
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
