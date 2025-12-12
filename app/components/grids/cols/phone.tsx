// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function usePhoneCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'phone',
      headerName: 'Телефон',
      minWidth: 140,
      flex: 1
    }),
    []
  )
  return col
}
