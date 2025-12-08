// Project
import type { ReadTestsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tests.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

type Test = DtoWithoutEnums<ReadTestsWithPrimaryPropsSuccessResultItemDto>

export function useTestVersionCol(tests: Test[] | null | undefined) {
  const testCodeForId = React.useMemo(() => {
    const map = new Map(
      tests?.map((test) => [test.id, capitalize(test.code, true)]) ?? []
    )
    map.set(-1, 'УДАЛЕН')
    return map
  }, [tests])

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'test',
      headerName: 'Тест',
      type: 'singleSelect',
      valueOptions: Array.from(testCodeForId.values()).toSorted(),
      valueGetter: (test: any) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        testCodeForId.get(test.id) ?? testCodeForId.get(-1),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/tests"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          hrefPath={`${params.row.test.id}/versions/${params.row.test.transitionNum}`}
        />
      ),
      minWidth: 150,
      flex: 1
    }),
    []
  )

  return col
}
