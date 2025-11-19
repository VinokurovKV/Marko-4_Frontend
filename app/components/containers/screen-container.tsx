// Project
import { Background } from './background'
// Material UI
import { styled } from '@mui/material/styles'

export interface ScreenCardProps {
  children: React.ReactNode
}

function ScreenContainerUnstyled(props: ScreenCardProps) {
  return <Background> {props.children} </Background>
}

export const ScreenContainer = styled(ScreenContainerUnstyled)(({ theme }) => ({
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4)
  }
}))
