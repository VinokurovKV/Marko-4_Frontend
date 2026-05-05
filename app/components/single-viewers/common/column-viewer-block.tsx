// Material UI
import Divider from '@mui/material/Divider'
// Other
import capitalize from 'capitalize'

export interface ColumnViewerBlockProps {
  title?: string
  children: React.ReactNode
}

export function ColumnViewerBlock(props: ColumnViewerBlockProps) {
  return (
    <>
      {props.title ? (
        <Divider sx={{ my: 0.5 }}>
          {props.title ? capitalize(props.title, true) : null}
        </Divider>
      ) : (
        <Divider sx={{ my: 0.5 }} />
      )}
      {props.children}
    </>
  )
}
