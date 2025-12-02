// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useDbcsCountCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'dbcsCount',
      headerName: 'Баз. конфиг.',
      type: 'number',
      minWidth: 140,
      flex: 0.01
    }),
    []
  )
  return col
}
