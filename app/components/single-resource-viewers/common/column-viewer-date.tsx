// Project
import { formatDate } from '~/utilities/format-date'
// Material UI
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export interface ColumnViewerDateProps {
  field: string
  date: Date
  Icon?: React.ReactNode
}

export function ColumnViewerDate(props: ColumnViewerDateProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} p={0}>
      <Typography
        sx={{
          fontWeight: 'bold'
        }}
      >
        {capitalize(props.field, true) + ':'}
      </Typography>
      <Typography>{formatDate(props.date)}</Typography>
      {props.Icon ? props.Icon : null}
    </Stack>
  )
}
