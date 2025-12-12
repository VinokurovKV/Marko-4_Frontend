// Project
import { type TaskStatus } from '@common/enums'
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
// Other
import capitalize from 'capitalize'

interface TaskStatusIconProps {
  status: TaskStatus
}

export function TaskStatusIcon({ status }: TaskStatusIconProps) {
  return (
    <Tooltip
      title={capitalize(localizationForTaskStatus.get(status) ?? status ?? '')}
    >
      {status === 'CREATED' ? (
        <WatchLaterIcon sx={{ fontSize: '25px', color: 'lightskyblue' }} />
      ) : status === 'CREATED_PAUSED' ? (
        <Stack direction="row">
          <WatchLaterIcon sx={{ fontSize: '25px', color: 'lightskyblue' }} />
          <PauseCircleIcon sx={{ fontSize: '25px', color: 'burlywood' }} />
        </Stack>
      ) : status === 'CANCELED' ? (
        <DoNotDisturbOnIcon sx={{ fontSize: '25px', color: 'indianred' }} />
      ) : status === 'LAUNCHED' ? (
        <CircularProgress
          size={25}
          thickness={7}
          sx={{ color: 'lightskyblue' }}
        />
      ) : status === 'LAUNCHED_PAUSED' ? (
        <PauseCircleIcon sx={{ fontSize: '25px', color: 'burlywood' }} />
      ) : status === 'ABORTED_BY_USER' ? (
        <CancelIcon sx={{ fontSize: '25px', color: 'tomato' }} />
      ) : status === 'ABORTED_DUE_TO_NOT_PASSED' ? (
        <ErrorIcon sx={{ fontSize: '25px', color: 'red' }} />
      ) : status === 'COMPLETED' ? (
        <CheckCircleIcon sx={{ fontSize: '25px', color: 'mediumaquamarine' }} />
      ) : (
        <></>
      )}
    </Tooltip>
  )
}
