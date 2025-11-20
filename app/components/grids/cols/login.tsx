// Project
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

export function useLoginCol(userIdField: string, header: boolean) {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'login',
      headerName: 'Логин',
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          refObjectId={params.row[userIdField]}
          text={params.value}
          hrefPrefix="/users"
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
