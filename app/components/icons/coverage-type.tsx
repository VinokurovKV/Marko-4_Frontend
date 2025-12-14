// Project
import { type CoverageType } from '@common/enums'
import { localizationForCoverageType } from '~/localization'
// Material UI
import LockOpenIcon from '@mui/icons-material/LockOpenTwoTone'
import LockIcon from '@mui/icons-material/LockTwoTone'
import PanToolAltIcon from '@mui/icons-material/PanToolAltTwoTone'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
// Other
import capitalize from 'capitalize'

export function getValue(type: CoverageType) {
  return capitalize(localizationForCoverageType.get(type) ?? type ?? '')
}

interface CoverageTypeIconProps {
  type: CoverageType
}

export function CoverageTypeIcon({ type }: CoverageTypeIconProps) {
  const value = getValue(type)
  return (
    <Tooltip title={value}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        sx={{ height: '100%' }}
      >
        <>
          <LockIcon color="error" sx={{ fontSize: '25px', opacity: 0.8 }} />
          {type !== 'ONLY_MUST' ? (
            <PanToolAltIcon
              color="warning"
              sx={{ fontSize: '25px', opacity: 0.8 }}
            />
          ) : null}
          {type === 'FULL' ? (
            <LockOpenIcon
              color="success"
              sx={{ fontSize: '25px', opacity: 0.8 }}
            />
          ) : null}
        </>
      </Stack>
    </Tooltip>
  )
}
