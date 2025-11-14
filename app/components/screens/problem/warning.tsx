// Project
import { type ProblemScreenProps, ProblemScreen } from './problem'
// Material UI
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'

export type WarningScreenProps = Omit<ProblemScreenProps, 'icon'>

export function WarningScreen(props: WarningScreenProps) {
  return (
    <ProblemScreen
      icon={{ Icon: WarningAmberRoundedIcon, color: 'warning' }}
      text={props.text}
      actionButton={props.actionButton}
    />
  )
}
