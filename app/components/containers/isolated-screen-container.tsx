// Project
import { Background } from './background'
// Material UI
import { styled } from '@mui/material/styles'

export interface ScreenCardProps {
  children: React.ReactNode
}

function IsolatedScreenContainerUnstyled(props: ScreenCardProps) {
  return <Background> {props.children} </Background>
}

export const IsolatedScreenContainer = styled(IsolatedScreenContainerUnstyled)(
  ({ theme }) => ({
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(4)
    }
  })
)
