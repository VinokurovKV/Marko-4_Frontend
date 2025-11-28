// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useTestsCountCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'testsCount',
      headerName: 'Тесты',
      type: 'number',
      minWidth: 80,
      flex: 0.01
    }),
    []
  )
  return col
}
