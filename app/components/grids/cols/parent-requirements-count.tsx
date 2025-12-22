// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useParentRequirementsCountCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'parentRequirementsCount',
      headerName: 'Родит.',
      type: 'number',
      minWidth: 60,
      flex: 0.01
    }),
    []
  )
  return col
}
