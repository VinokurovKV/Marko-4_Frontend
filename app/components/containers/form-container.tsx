// Material UI
import { styled } from '@mui/material/styles'
import Container from '@mui/material/Container'

export const FormContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4)
  },
  width: '80vw',
  [theme.breakpoints.up('sm')]: {
    width: '700px'
  }
}))
