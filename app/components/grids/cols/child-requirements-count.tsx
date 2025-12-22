// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useChildRequirementsCountCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'childRequirementsCount',
      headerName: 'Дочер.',
      type: 'number',
      minWidth: 60,
      flex: 0.01
    }),
    []
  )
  return col
}
