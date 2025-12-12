// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useSurnameCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'surname',
      headerName: 'Фамилия',
      minWidth: 140,
      flex: 1
    }),
    []
  )
  return col
}
