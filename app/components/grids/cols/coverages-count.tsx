// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useCoveragesCountCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'coveragesCount',
      headerName: 'Покрытия',
      type: 'number',
      minWidth: 100,
      flex: 0.01
    }),
    []
  )
  return col
}
