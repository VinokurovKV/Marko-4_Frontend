// Project
import { type TestStatus } from '@common/enums'
import { localizationForTestStatus } from '~/localization'
// Material UI
import CancelIcon from '@mui/icons-material/CancelTwoTone'
import CloseIcon from '@mui/icons-material/Close'
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOnTwoTone'
import DoneIcon from '@mui/icons-material/Done'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import WatchLaterIcon from '@mui/icons-material/WatchLaterTwoTone'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
// Other
import capitalize from 'capitalize'

interface TestStatusIconProps {
  status: TestStatus
}

export function TestStatusIcon({ status }: TestStatusIconProps) {
  return (
    <Tooltip
      title={capitalize(localizationForTestStatus.get(status) ?? status ?? '')}
    >
      {status === 'WAITING' ? (
        <WatchLaterIcon sx={{ color: 'lightskyblue' }} />
      ) : status === 'CANCELED' ? (
        <DoNotDisturbOnIcon sx={{ color: 'indianred' }} />
      ) : status === 'LAUNCHED' ? (
        <CircularProgress
          size={22}
          thickness={7}
          sx={{ color: 'lightskyblue' }}
        />
      ) : status === 'ABORTED' ? (
        <CancelIcon sx={{ color: 'tomato' }} />
      ) : status === 'ERROR' ? (
        <PriorityHighIcon sx={{ color: 'red' }} />
      ) : status === 'FAILED' ? (
        <CloseIcon color="error" />
      ) : status === 'PASSED' ? (
        <DoneIcon color="success" />
      ) : (
        <></>
      )}
    </Tooltip>
  )
}
