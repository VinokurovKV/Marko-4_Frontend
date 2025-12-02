// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useNumInSubgroupCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'numInSubgroup',
      headerName: 'Номер в подгруппе',
      type: 'number',
      minWidth: 170,
      flex: 0.01
    }),
    []
  )
  return col
}
