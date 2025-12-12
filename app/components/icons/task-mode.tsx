// Project
import { type TaskMode } from '@common/enums'
import { localizationForTaskMode } from '~/localization'
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
// Other
import capitalize from 'capitalize'

interface TaskModeIconProps {
  mode: TaskMode
}

export function TaskModeIcon({ mode }: TaskModeIconProps) {
  return (
    <Tooltip
      title={capitalize(localizationForTaskMode.get(mode) ?? mode ?? '')}
    >
      {mode === 'TEST' ? (
        <FlakyIcon sx={{ fontSize: '25px', color: 'orchid' }} />
      ) : mode === 'GENERATE_PASS_CRITERIA_WITHOUT_UPDATE' ? (
        <StarIcon sx={{ fontSize: '25px', color: 'mediumslateblue' }} />
      ) : mode === 'GENERATE_PASS_CRITERIA_WITH_UPDATE' ? (
        <Stack direction="row">
          <StarIcon sx={{ fontSize: '25px', color: 'mediumslateblue' }} />
          <SwapHorizIcon sx={{ fontSize: '25px', color: 'orchid' }} />
        </Stack>
      ) : (
        <></>
      )}
    </Tooltip>
  )
}
