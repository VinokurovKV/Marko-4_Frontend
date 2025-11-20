// Project
import { GridEmailCell } from '../cells/grid-email-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useEmailCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'email',
      headerName: 'E-mail',
      renderCell: GridEmailCell,
      minWidth: 150,
      flex: 1
    }),
    []
  )
  return col
}
