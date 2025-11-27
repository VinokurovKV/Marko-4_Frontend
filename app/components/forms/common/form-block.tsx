// Material UI
import Divider from '@mui/material/Divider'
// Other
import capitalize from 'capitalize'

export interface FormBlockProps {
  title: string
  children: React.ReactNode
}

export function FormBlock(props: FormBlockProps) {
  return (
    <>
      <Divider>{capitalize(props.title, true)}</Divider>
      {props.children}
    </>
  )
}
