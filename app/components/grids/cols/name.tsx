// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useNameCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'name',
      headerName: 'Название',
      minWidth: 150,
      flex: 1
    }),
    []
  )
  return col
}
