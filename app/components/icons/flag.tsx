// Material UI
import CloseIcon from '@mui/icons-material/Close'
import DoneIcon from '@mui/icons-material/Done'

interface PreparedIconProps {
  flag: boolean
}

export function FlagIcon({ flag }: PreparedIconProps) {
  return flag ? <DoneIcon color="success" /> : <CloseIcon color="error" />
}
