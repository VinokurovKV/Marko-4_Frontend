// Project
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

export function useRoleNameCol(roleIdField: string, header: boolean) {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'name',
      headerName: 'Название',
      hideable: !header,
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/roles"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row[roleIdField]}
          header={header}
        />
      ),
      minWidth: 140,
      flex: 1
    }),
    []
  )
  return col
}
