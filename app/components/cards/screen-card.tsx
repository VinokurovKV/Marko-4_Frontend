// Material UI
import Card from '@mui/material/Card'
import { styled } from '@mui/material/styles'

export interface ScreenCardProps {
  children: React.ReactNode
}

function ScreenCardUnstyled(props: ScreenCardProps) {
  return <Card {...props} variant="elevation" raised={true} />
}

export const ScreenCard = styled(ScreenCardUnstyled)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px'
  }
}))
