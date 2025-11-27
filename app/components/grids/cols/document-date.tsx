// Project
// import { formatDate } from '~/utilities/format-date'
import { useDateCol } from './date'
// React
// import * as React from 'react'
// Material UI
// import type { GridColDef } from '@mui/x-data-grid'

export function useDocumentDateCol() {
  return useDateCol({
    field: 'date',
    headerName: 'Дата публикации',
    minWidth: 150,
    flex: 1
  })
  // const col: GridColDef = React.useMemo(
  //   () => ({
  //     field: 'date',
  //     headerName: 'Дата публикации',
  //     type: 'date',
  //     // valueGetter: (date: any) =>
  //     //   date instanceof Date ? formatDate(date) : '',
  //     minWidth: 150,
  //     flex: 1
  //   }),
  //   []
  // )
  // return col
}
