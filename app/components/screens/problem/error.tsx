// Project
import { type ProblemScreenProps, ProblemScreen } from './problem'
// Material UI
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'

export type ErrorScreenProps = Omit<ProblemScreenProps, 'icon'>

export function ErrorScreen(props: ErrorScreenProps) {
  return (
    <ProblemScreen
      icon={{ Icon: ErrorOutlineRoundedIcon, color: 'error' }}
      text={props.text}
      actionButton={props.actionButton}
    />
  )
}
