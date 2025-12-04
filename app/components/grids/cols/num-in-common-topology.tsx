// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useNumInCommonTopologyCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'numInCommonTopology',
      headerName: 'Номер в общей топологии',
      type: 'number',
      minWidth: 220,
      flex: 0.01
    }),
    []
  )
  return col
}
