// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useForenameCol() {
  const col: GridColDef = React.useMemo(
    () => ({ field: 'forename', headerName: 'Имя', minWidth: 150, flex: 1 }),
    []
  )
  return col
}
