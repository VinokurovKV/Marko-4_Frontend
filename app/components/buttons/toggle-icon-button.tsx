// React
import * as React from 'react'
// Material UI
import { styled } from '@mui/material/styles'
import IconButton, { type IconButtonProps } from '@mui/material/IconButton'
import type { OverridableComponent } from '@mui/material/OverridableComponent'
import type { SvgIconTypeMap } from '@mui/material/SvgIcon'
import Tooltip from '@mui/material/Tooltip'
// Other
import capitalize from 'capitalize'

const ENTER_DELAY = 1000

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Icon = OverridableComponent<SvgIconTypeMap<{}, 'svg'>> & {
  muiName: string
}

interface ToggleIconButtonWithoutTooltipProps
  extends Omit<IconButtonProps, 'size' | 'onClick' | 'onToggle'> {
  ActiveIcon: Icon
  InactiveIcon: Icon
  active: boolean
  onToggle: (active: boolean) => void
}

function ToggleIconButtonWithoutTooltipUnstyled({
  ActiveIcon,
  InactiveIcon,
  active,
  onToggle,
  ...props
}: ToggleIconButtonWithoutTooltipProps) {
  const handleClick = React.useCallback(() => {
    onToggle(!active)
  }, [active, onToggle])

  return (
    <IconButton {...props} size="small" onClick={handleClick}>
      {active ? <ActiveIcon /> : <InactiveIcon />}
    </IconButton>
  )
}

const ToggleIconButtonWithoutTooltip = styled(
  ToggleIconButtonWithoutTooltipUnstyled
)(({ theme }) => ({
  '&.MuiButtonBase-root': {
    height: '2rem',
    width: '2rem',
    borderWidth: 1.2,
    borderStyle: 'solid',
    borderColor: theme.palette.grey[600],
    borderRadius: theme.shape.borderRadius
  }
}))

export interface ToggleIconButtonProps
  extends ToggleIconButtonWithoutTooltipProps {
  activePrompt: string
  inactivePrompt: string
}

export function ToggleIconButton({
  activePrompt,
  inactivePrompt,
  active,
  ...props
}: ToggleIconButtonProps) {
  return (
    <Tooltip
      title={active ? capitalize(activePrompt) : capitalize(inactivePrompt)}
      enterDelay={ENTER_DELAY}
    >
      <ToggleIconButtonWithoutTooltip active={active} {...props} />
    </Tooltip>
  )
}
