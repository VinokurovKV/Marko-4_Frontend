// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useDsefsCountCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'dsefsCount',
      headerName: 'Число доп. форматов',
      type: 'number',
      minWidth: 150,
      flex: 1
    }),
    []
  )
  return col
}
