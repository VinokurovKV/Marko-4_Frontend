// React
import * as React from 'react'
// Material UI
import CloseIcon from '@mui/icons-material/Close'
import DoneIcon from '@mui/icons-material/Done'
import Stack from '@mui/material/Stack'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

interface PausedIconProps {
  flag: boolean
}

function PausedIcon({ flag }: PausedIconProps) {
  return flag ? <DoneIcon color="success" /> : <CloseIcon color="error" />
  // return flag ? <DoneIcon /> : <CloseIcon />
}

export function usePausedCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'paused',
      headerName: 'Приостановлено',
      type: 'boolean',
      renderCell: (params: GridRenderCellParams<any, boolean>) => (
        <Stack>
          <PausedIcon flag={params.value === true} />
        </Stack>
      ),
      minWidth: 150,
      flex: 0.01
    }),
    []
  )
  return col
}
