// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useRequirementsCountCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'requirementsCount',
      headerName: 'Требования',
      type: 'number',
      minWidth: 100,
      flex: 0.01
    }),
    []
  )
  return col
}
