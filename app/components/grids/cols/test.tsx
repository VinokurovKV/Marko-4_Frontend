// Project
import type { TestPrimary } from '~/types'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export function useTestCol(tests: TestPrimary[] | null | undefined) {
  const testCodeForId = React.useMemo(
    () =>
      new Map(
        tests?.map((test) => [test.id, capitalize(test.code, true)]) ?? []
      ),
    [tests]
  )

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'testId',
      headerName: 'Тест',
      type: 'singleSelect',
      valueOptions: Array.from(testCodeForId.values()).toSorted(),
      valueGetter: (testId) => testCodeForId.get(testId),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/hierarchy/tests"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row.testId}
        />
      ),
      minWidth: 140,
      flex: 1
    }),
    []
  )

  return col
}
