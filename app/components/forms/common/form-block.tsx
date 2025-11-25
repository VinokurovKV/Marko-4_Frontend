// Material UI
import Divider from '@mui/material/Divider'
// Other
import capitalize from 'capitalize'

export interface FormProps {
  title: string
  children: React.ReactNode
}

export function FormBlock(props: FormProps) {
  return (
    <>
      <Divider>{capitalize(props.title, true)}</Divider>
      {props.children}
    </>
  )
}
