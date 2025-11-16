// Material UI
import Divider from '@mui/material/Divider'

export interface FormProps {
  title: string
  children: React.ReactNode
}

export function FormBlock(props: FormProps) {
  return (
    <>
      <Divider sx={{ textTransform: 'capitalize' }}>{props.title}</Divider>
      {props.children}
    </>
  )
}
