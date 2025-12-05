// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useNumInGroupCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'numInGroup',
      headerName: 'Номер в группе',
      type: 'number',
      minWidth: 150,
      flex: 0.01
    }),
    []
  )
  return col
}
