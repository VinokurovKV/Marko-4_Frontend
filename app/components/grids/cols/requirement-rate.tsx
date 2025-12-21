// React
import * as React from 'react'
// Material UI
import Stack from '@mui/material/Stack'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

export function useRequirementRateCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'rate',
      headerName: 'Атом. коэф.',
      type: 'number',
      renderCell: (params: GridRenderCellParams<any, any>) => (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        <Stack sx={{ opacity: params.row.atomic !== true ? 0.2 : undefined }}>
          {params.value}
        </Stack>
      ),
      minWidth: 100,
      flex: 0.01
    }),
    []
  )
  return col
}
