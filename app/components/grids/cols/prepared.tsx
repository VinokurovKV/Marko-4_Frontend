// Project
import type { Gender } from '@common/enums'
// React
import * as React from 'react'
// Material UI
import CloseIcon from '@mui/icons-material/Close'
import DoneIcon from '@mui/icons-material/Done'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

interface PreparedIconProps {
  flag: boolean
}

function PreparedIcon({ flag }: PreparedIconProps) {
  return flag ? <DoneIcon color="success" /> : <CloseIcon color="error" />
}

export function usePreparedCol(
  gender: Gender,
  truePrompt?: string,
  falsePrompt?: string
) {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'prepared',
      headerName:
        'Готовность' /* `Готов${gender === 'MALE' ? '' : gender === 'FEMALE' ? 'а' : 'о'} к использованию` */,
      type: 'boolean',
      renderCell: (params: GridRenderCellParams<any, boolean>) => (
        <Tooltip
          title={capitalize(
            (params.value === true ? truePrompt : falsePrompt) ?? ''
          )}
        >
          <Stack>
            <PreparedIcon flag={params.value === true} />
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
