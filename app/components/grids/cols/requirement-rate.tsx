// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useRequirementRateCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'rate',
      headerName: 'Атом. коэффициент',
      type: 'number',
      minWidth: 140,
      flex: 0.01
    }),
    []
  )
  return col
}
