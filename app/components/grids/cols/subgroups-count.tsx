// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useSubgroupsCountCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'subgroupsCount',
      headerName: 'Подгруппы',
      type: 'number',
      minWidth: 100,
      flex: 0.01
    }),
    []
  )
  return col
}
