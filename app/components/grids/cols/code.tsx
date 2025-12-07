// Project
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

export function useCodeCol(
  resourceIdField: string,
  header: boolean,
  hrefPrefix: string
) {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'code',
      headerName: 'Код',
      hideable: !header,
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix={hrefPrefix}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row[resourceIdField]}
          header={header}
          disableCapitalize
        />
      ),
      minWidth: 150,
      flex: 1
    }),
    []
  )
  return col
}
