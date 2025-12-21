// React
import * as React from 'react'
// Material UI
import CloseIcon from '@mui/icons-material/Close'
import DoneIcon from '@mui/icons-material/Done'
import Stack from '@mui/material/Stack'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

interface AtomicIconProps {
  flag: boolean
}

function AtomicIcon({ flag }: AtomicIconProps) {
  return flag ? <DoneIcon color="success" /> : <CloseIcon color="error" />
}

export function useAtomicCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'atomic',
      headerName: 'Атом.',
      type: 'boolean',
      renderCell: (params: GridRenderCellParams<any, boolean>) => (
        <Stack>
          <AtomicIcon flag={params.value === true} />
        </Stack>
      ),
      minWidth: 60,
      flex: 0.01
    }),
    []
  )
  return col
}
