// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useCoveredRequirementsCountCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'requirementsCount',
      headerName: 'Покр. требования',
      type: 'number',
      minWidth: 140,
      flex: 0.01
    }),
    []
  )
  return col
}
