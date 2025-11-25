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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          refObjectId={params.row[roleIdField]}
          text={params.value}
          hrefPrefix="/roles"
          header={header}
        />
      ),
      minWidth: 150,
      flex: 1
    }),
    []
  )
  return col
}
