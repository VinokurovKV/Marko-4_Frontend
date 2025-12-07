// Project
import { type TaskStatus, allTaskStatuses } from '@common/enums'
import { localizationForTaskStatus } from '~/localization'
// React
import * as React from 'react'
// Material UI
// import AutorenewIcon from '@mui/icons-material/Autorenew'
// import BlockIcon from '@mui/icons-material/Block'
// import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CancelIcon from '@mui/icons-material/CancelTwoTone'
import CheckCircleIcon from '@mui/icons-material/CheckCircleTwoTone'
// import CheckIcon from '@mui/icons-material/Check'
// import CloseIcon from '@mui/icons-material/Close'
// import CoronavirusIcon from '@mui/icons-material/Coronavirus'
// import CrisisAlertIcon from '@mui/icons-material/CrisisAlert'
// import DangerousIcon from '@mui/icons-material/Dangerous'
// import DataUsageIcon from '@mui/icons-material/DataUsage'
// import DoDisturbIcon from '@mui/icons-material/DoDisturb'
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOnTwoTone'
// import DoneIcon from '@mui/icons-material/Done'
// import DoneAllIcon from '@mui/icons-material/DoneAll'
// import DoneOutlineIcon from '@mui/icons-material/DoneOutline'
// import DownloadDoneIcon from '@mui/icons-material/DownloadDone'
import ErrorIcon from '@mui/icons-material/ErrorTwoTone'
// import FlagIcon from '@mui/icons-material/Flag'
// import FlakyIcon from '@mui/icons-material/Flaky'
// import HardwareIcon from '@mui/icons-material/Hardware'
// import HourglassTopIcon from '@mui/icons-material/HourglassTop'
// import LockOpenIcon from '@mui/icons-material/LockOpen'
// import LockIcon from '@mui/icons-material/Lock'
// import LoopIcon from '@mui/icons-material/Loop'
// import NewReleasesIcon from '@mui/icons-material/NewReleases'
// import PanToolAltIcon from '@mui/icons-material/PanToolAlt'
import PauseCircleIcon from '@mui/icons-material/PauseCircleTwoTone'
// import PauseIcon from '@mui/icons-material/Pause'
// import PlayArrowIcon from '@mui/icons-material/PlayArrow'
// import PlayCircleIcon from '@mui/icons-material/PlayCircle'
// import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges'
// import ReplayIcon from '@mui/icons-material/Replay'
// import ReplayCircleFilledIcon from '@mui/icons-material/ReplayCircleFilled'
// import ReportIcon from '@mui/icons-material/Report'
// import ReportProblemIcon from '@mui/icons-material/ReportProblem'
// import RestartAltIcon from '@mui/icons-material/RestartAlt'
// import SportsScoreIcon from '@mui/icons-material/SportsScore'
// import StopIcon from '@mui/icons-material/Stop'
// import StopCircleIcon from '@mui/icons-material/StopCircle'
// import SyncIcon from '@mui/icons-material/Sync'
// import TaskAltIcon from '@mui/icons-material/TaskAlt'
// import ThunderstormIcon from '@mui/icons-material/Thunderstorm'
// import TungstenIcon from '@mui/icons-material/Tungsten'
// import VerifiedIcon from '@mui/icons-material/Verified'
import WatchLaterIcon from '@mui/icons-material/WatchLaterTwoTone'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(status: TaskStatus) {
  return capitalize(localizationForTaskStatus.get(status) ?? status ?? '')
}

interface TaskStatusIconProps {
  value?: string
}

function TaskStatusIcon({ value }: TaskStatusIconProps) {
  return (
    <Tooltip title={value}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        sx={{ height: '100%' }}
      >
        {value === getValue('CREATED') ? (
          <WatchLaterIcon sx={{ color: 'lightskyblue' }} />
        ) : value === getValue('CREATED_PAUSED') ? (
          <>
            <WatchLaterIcon sx={{ color: 'lightskyblue' }} />
            <PauseCircleIcon sx={{ color: 'burlywood' }} />
          </>
        ) : value === getValue('CANCELED') ? (
          <DoNotDisturbOnIcon sx={{ color: 'indianred' }} />
        ) : value === getValue('LAUNCHED') ? (
          <CircularProgress
            size={22}
            thickness={7}
            sx={{ color: 'lightskyblue' }}
          />
        ) : value === getValue('LAUNCHED_PAUSED') ? (
          <PauseCircleIcon sx={{ color: 'burlywood' }} />
        ) : value === getValue('ABORTED_BY_USER') ? (
          <CancelIcon sx={{ color: 'tomato' }} />
        ) : value === getValue('ABORTED_DUE_TO_NOT_PASSED') ? (
          <ErrorIcon sx={{ color: 'red' }} />
        ) : value === getValue('COMPLETED') ? (
          <CheckCircleIcon sx={{ color: 'mediumaquamarine' }} />
        ) : null}
      </Stack>
    </Tooltip>
  )
}

export function useTaskStatusCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'status',
      headerName: 'Статус',
      type: 'singleSelect',
      valueOptions: allTaskStatuses.map(getValue),
      valueGetter: getValue,
      renderCell: (params: GridRenderCellParams<any, TaskStatus>) => (
        <TaskStatusIcon value={params.value} />
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
