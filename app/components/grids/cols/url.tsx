// Project
import { GridExternalRefCell } from '../cells/grid-external-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

export function useUrlCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'url',
      headerName: 'Ссылка на источник',
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridExternalRefCell
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          href={params.row.url}
          disableCapitalize={true}
        />
      ),
      minWidth: 150,
      flex: 1
    }),
    []
  )
  return col
}
