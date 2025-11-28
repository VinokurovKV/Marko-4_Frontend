// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useFragmentsCountCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'fragmentsCount',
      headerName: 'Фрагменты',
      type: 'number',
      minWidth: 120,
      flex: 0.01
    }),
    []
  )
  return col
}
