// Material UI
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export interface ColumnViewerItemProps {
  field: string
  val?: string | number
  Icon?: React.ReactNode
}

export function ColumnViewerItem(props: ColumnViewerItemProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} p={0}>
      <Typography
        sx={{
          fontWeight: 'bold'
        }}
      >
        {capitalize(props.field, true) + ':'}
      </Typography>
      {props.val !== undefined ? <Typography>{props.val}</Typography> : null}
      {props.Icon ? props.Icon : null}
    </Stack>
  )
}
