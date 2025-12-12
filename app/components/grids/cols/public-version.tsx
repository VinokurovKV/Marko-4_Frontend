// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function usePublicVersionCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'publicVersion',
      headerName: 'Версия',
      minWidth: 140,
      flex: 1
    }),
    []
  )
  return col
}
