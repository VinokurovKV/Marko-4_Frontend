// Project
import { type RequirementModifier } from '@common/enums'
import { localizationForRequirementModifier } from '~/localization'
// Material UI
import LockOpenIcon from '@mui/icons-material/LockOpenTwoTone'
import LockIcon from '@mui/icons-material/LockTwoTone'
import PanToolAltIcon from '@mui/icons-material/PanToolAltTwoTone'
import Tooltip from '@mui/material/Tooltip'
// Other
import capitalize from 'capitalize'

export function getValue(modifier: RequirementModifier) {
  return capitalize(
    localizationForRequirementModifier.get(modifier) ?? modifier ?? ''
  )
}

interface RequirementModifierIconProps {
  modifier: RequirementModifier
}

export function RequirementModifierIcon({
  modifier
}: RequirementModifierIconProps) {
  return (
    <Tooltip
      title={capitalize(
        localizationForRequirementModifier.get(modifier) ?? modifier ?? ''
      )}
    >
      {modifier === 'MUST' ? (
        <LockIcon color="error" sx={{ opacity: 0.8 }} />
      ) : modifier === 'SHOULD' ? (
        <PanToolAltIcon color="warning" sx={{ opacity: 0.8 }} />
      ) : modifier === 'MAY' ? (
        <LockOpenIcon color="success" sx={{ opacity: 0.8 }} />
      ) : (
        <></>
      )}
    </Tooltip>
  )
}
