// React
import * as React from 'react'
// Material UI
import CloseIcon from '@mui/icons-material/Close'
import DoneIcon from '@mui/icons-material/Done'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

interface AbortIfNotPassedIconProps {
  flag: boolean
}

function AbortIfNotPassedIcon({ flag }: AbortIfNotPassedIconProps) {
  return flag ? <DoneIcon color="success" /> : <CloseIcon color="error" />
  // return flag ? <DoneIcon /> : <CloseIcon />
}

export function useAbortIfNotPassedCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'abortIfNotPassed',
      headerName: 'Прерывать',
      type: 'boolean',
      renderCell: (params: GridRenderCellParams<any, boolean>) => (
        <Tooltip
          title={
            params.value === true
              ? 'Прерывать при непрохождении либо ошибке'
              : 'Не прерывать при непрохождении либо ошибке'
          }
        >
          <Stack>
            <AbortIfNotPassedIcon flag={params.value === true} />
          </Stack>
        </Tooltip>
      ),
      minWidth: 120,
      flex: 0.01
    }),
    []
  )
  return col
}
