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

interface CoveredIconProps {
  flag: boolean
}

function CoveredIcon({ flag }: CoveredIconProps) {
  return flag ? <DoneIcon color="success" /> : <CloseIcon color="error" />
}

export function useCoveredCol(
  gender: Gender,
  truePrompt?: string,
  falsePrompt?: string
) {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'covered',
      headerName: `Покрыт${gender === 'MALE' ? '' : gender === 'FEMALE' ? 'а' : 'о'}`,
      type: 'boolean',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions
      rowSpanValueGetter: (value, row) => `${row.id}_${value}`,
      renderCell: (params: GridRenderCellParams<any, boolean>) => (
        <Tooltip
          title={capitalize(
            (params.value === true ? truePrompt : falsePrompt) ?? ''
          )}
        >
          <Stack>
            <CoveredIcon flag={params.value === true} />
          </Stack>
        </Tooltip>
      ),
      minWidth: 90,
      flex: 0.01
    }),
    [gender, truePrompt, falsePrompt]
  )
  return col
}
