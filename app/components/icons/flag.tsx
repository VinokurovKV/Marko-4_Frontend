// Material UI
import CloseIcon from '@mui/icons-material/Close'
import DoneIcon from '@mui/icons-material/Done'
import Tooltip from '@mui/material/Tooltip'
// Other
import capitalize from 'capitalize'

interface PreparedIconProps {
  flag: boolean
  truePrompt?: string
  falsePrompt?: string
}

export function FlagIcon({ flag, truePrompt, falsePrompt }: PreparedIconProps) {
  return (
    <Tooltip title={capitalize((flag ? truePrompt : falsePrompt) ?? '')}>
      {flag ? (
        <DoneIcon color="success" sx={{ fontSize: '25px' }} />
      ) : (
        <CloseIcon color="error" sx={{ fontSize: '25px' }} />
      )}
    </Tooltip>
  )
}
