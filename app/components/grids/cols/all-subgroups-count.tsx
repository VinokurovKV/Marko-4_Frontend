// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useAllSubgroupsCountCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'allSubgroupsCount',
      headerName: 'Все подгруппы',
      type: 'number',
      minWidth: 150,
      flex: 0.01
    }),
    []
  )
  return col
}
