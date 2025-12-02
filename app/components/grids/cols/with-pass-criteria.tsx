// React
import * as React from 'react'
// Material UI
import CloseIcon from '@mui/icons-material/Close'
import DoneIcon from '@mui/icons-material/Done'
import Stack from '@mui/material/Stack'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

interface WithPassCriteriaIconProps {
  flag: boolean
}

function WithPassCriteriaIcon({ flag }: WithPassCriteriaIconProps) {
  return flag ? <DoneIcon color="success" /> : <CloseIcon color="error" />
}

export function useWithPassCriteriaCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'withPassCriteria',
      headerName: 'Критерий прохождения',
      type: 'boolean',
      renderCell: (params: GridRenderCellParams<any, boolean>) => (
        <Stack>
          <WithPassCriteriaIcon flag={params.value === true} />
        </Stack>
      ),
      minWidth: 190,
      flex: 0.01
    }),
    []
  )
  return col
}
