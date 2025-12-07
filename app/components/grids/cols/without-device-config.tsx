// React
import * as React from 'react'
// Material UI
import CloseIcon from '@mui/icons-material/Close'
import DoneIcon from '@mui/icons-material/Done'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

interface WithoutDeviceConfigIconProps {
  flag: boolean
}

function WithoutDeviceConfigIcon({ flag }: WithoutDeviceConfigIconProps) {
  return flag ? <DoneIcon color="success" /> : <CloseIcon color="error" />
  // return flag ? <DoneIcon /> : <CloseIcon />
}

export function useWithoutDeviceConfigCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'withoutDeviceConfig',
      headerName: 'Без конфигурирования',
      type: 'boolean',
      renderCell: (params: GridRenderCellParams<any, boolean>) => (
        <Tooltip
          title={
            params.value === true
              ? 'Без конфигурирования устройств'
              : 'С конфигурированием устройств'
          }
        >
          <Stack>
            <WithoutDeviceConfigIcon flag={params.value === true} />
          </Stack>
        </Tooltip>
      ),
      minWidth: 190,
      flex: 0.01
    }),
    []
  )
  return col
}
