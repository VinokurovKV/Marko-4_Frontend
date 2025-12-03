// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useNumCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'num',
      headerName: 'Номер',
      type: 'number',
      minWidth: 120,
      flex: 0.01
    }),
    []
  )
  return col
}
