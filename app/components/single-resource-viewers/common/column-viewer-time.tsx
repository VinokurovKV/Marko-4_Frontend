// Project
import { formatDateTime } from '~/utilities/format-date'
// Material UI
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export interface ColumnViewerTimeProps {
  field: string
  time: Date
  Icon?: React.ReactNode
}

export function ColumnViewerTime(props: ColumnViewerTimeProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} p={0}>
      <Typography
        sx={{
          fontWeight: 'bold'
        }}
      >
        {capitalize(props.field, true) + ':'}
      </Typography>
      <Typography>{formatDateTime(props.time)}</Typography>
      {props.Icon ? props.Icon : null}
    </Stack>
  )
}
