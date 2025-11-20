// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function usePatronymicCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'patronymic',
      headerName: 'Отчество',
      minWidth: 150,
      flex: 1
    }),
    []
  )
  return col
}
