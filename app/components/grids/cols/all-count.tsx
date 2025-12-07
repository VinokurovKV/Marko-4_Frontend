// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useAllTestsCountCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'allTestsCount',
      headerName: 'Все тесты',
      type: 'number',
      minWidth: 120,
      flex: 0.01
    }),
    []
  )
  return col
}
