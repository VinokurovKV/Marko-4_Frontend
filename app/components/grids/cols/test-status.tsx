// Project
import { type TestStatus, allTestStatuses } from '@common/enums'
import { localizationForTestStatus } from '~/localization'
// React
import * as React from 'react'
// Material UI
import CancelIcon from '@mui/icons-material/CancelTwoTone'
import CloseIcon from '@mui/icons-material/Close'
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOnTwoTone'
import DoneIcon from '@mui/icons-material/Done'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import WatchLaterIcon from '@mui/icons-material/WatchLaterTwoTone'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(status: TestStatus) {
  return capitalize(localizationForTestStatus.get(status) ?? status ?? '')
}

interface TestStatusIconProps {
  value?: string
}

function TestStatusIcon({ value }: TestStatusIconProps) {
  return (
    <Tooltip title={value}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        sx={{ height: '100%' }}
      >
        {value === getValue('WAITING') ? (
          <WatchLaterIcon sx={{ color: 'lightskyblue' }} />
        ) : value === getValue('CANCELED') ? (
          <DoNotDisturbOnIcon sx={{ color: 'indianred' }} />
        ) : value === getValue('LAUNCHED') ? (
          <CircularProgress
            size={22}
            thickness={7}
            sx={{ color: 'lightskyblue' }}
          />
        ) : value === getValue('ABORTED') ? (
          <CancelIcon sx={{ color: 'tomato' }} />
        ) : value === getValue('ERROR') ? (
          <PriorityHighIcon sx={{ color: 'red' }} />
        ) : value === getValue('FAILED') ? (
          <CloseIcon color="error" />
        ) : value === getValue('PASSED') ? (
          <DoneIcon color="success" />
        ) : null}
      </Stack>
    </Tooltip>
  )
}

export function useTestStatusCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'status',
      headerName: 'Статус',
      type: 'singleSelect',
      valueOptions: allTestStatuses.map(getValue),
      valueGetter: getValue,
      renderCell: (params: GridRenderCellParams<any, TestStatus>) => (
        <TestStatusIcon value={params.value} />
      ),
      headerAlign: 'center',
      align: 'center',
      minWidth: 100,
      flex: 0.01
    }),
    []
  )

  return col
}
