// Project
import { type TaskMode, allTaskModes } from '@common/enums'
import { localizationForTaskMode } from '~/localization'
// React
import * as React from 'react'
// Material UI
// import ExploreIcon from '@mui/icons-material/Explore'
// import FlagIcon from '@mui/icons-material/Flag'
import FlakyIcon from '@mui/icons-material/FlakyTwoTone'
// import SportsScoreIcon from '@mui/icons-material/SportsScore'
import StarIcon from '@mui/icons-material/StarBorder'
// import StarHalfIcon from '@mui/icons-material/StarHalf'
import Stack from '@mui/material/Stack'
import SwapHorizIcon from '@mui/icons-material/SwapHorizTwoTone'
import Tooltip from '@mui/material/Tooltip'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(mode: TaskMode) {
  return capitalize(localizationForTaskMode.get(mode) ?? mode ?? '')
}

interface TaskModeIconProps {
  value?: string
}

function TaskModeIcon({ value }: TaskModeIconProps) {
  return (
    <Tooltip title={value}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={-0.5}
        sx={{ height: '100%' }}
      >
        {value === getValue('TEST') ? (
          <FlakyIcon sx={{ color: 'orchid' }} />
        ) : value === getValue('GENERATE_PASS_CRITERIA_WITHOUT_UPDATE') ? (
          <StarIcon sx={{ color: 'mediumslateblue' }} />
        ) : value === getValue('GENERATE_PASS_CRITERIA_WITH_UPDATE') ? (
          <>
            <StarIcon sx={{ color: 'mediumslateblue' }} />
            <SwapHorizIcon sx={{ color: 'orchid' }} />
          </>
        ) : null}
      </Stack>
    </Tooltip>
  )
}

export function useTaskModeCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'mode',
      headerName: 'Режим',
      type: 'singleSelect',
      valueOptions: allTaskModes.map(getValue),
      valueGetter: getValue,
      renderCell: (params: GridRenderCellParams<any, TaskMode>) => (
        <TaskModeIcon value={params.value} />
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
