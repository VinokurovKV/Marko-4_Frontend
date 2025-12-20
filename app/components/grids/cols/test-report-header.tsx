// Project
import type { TestPrimary } from '~/types'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export function useTestReportHeaderCol(
  tests: TestPrimary[] | null | undefined,
  disableRef?: boolean
) {
  const testCodeForId = React.useMemo(() => {
    const map = new Map(
      tests?.map((test) => [test.id, capitalize(test.code, true)]) ?? []
    )
    map.set(-1, 'УДАЛЕН')
    return map
  }, [tests])

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'testId',
      headerName: 'Тест',
      type: 'singleSelect',
      valueOptions: Array.from(testCodeForId.values()).toSorted(),
      valueGetter: (testId: number) =>
        testCodeForId.get(testId) ?? testCodeForId.get(-1),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/tasks"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          hrefPath={`${params.row.taskId}/${params.row.testId}`}
          header={true}
          disableRef={disableRef}
        />
      ),
      minWidth: 140,
      flex: 1
    }),
    [disableRef, testCodeForId]
  )

  return col
}
