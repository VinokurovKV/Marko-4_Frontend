// Project
import {
  GridPercentCell,
  GridPercentEditCell
} from '../cells/grid-percent-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'

export function useCoveragePercentCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'coveragePercent',
      headerName: 'Проц. покрытия',
      type: 'number',
      renderCell: GridPercentCell,
      renderEditCell: GridPercentEditCell,
      headerAlign: 'center',
      minWidth: 140,
      flex: 0.01
    }),
    []
  )
  return col
}
