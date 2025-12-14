// Project
import { PercentBar } from '~/components/progress-bar'
// Material UI
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export interface ColumnViewerPercentProps {
  field: string
  percent?: number | null
}

export function ColumnViewerPercent(props: ColumnViewerPercentProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} p={0}>
      <Typography
        sx={{
          fontWeight: 'bold'
        }}
      >
        {capitalize(props.field, true) + ':'}
      </Typography>
      {props.percent !== undefined && props.percent !== null ? (
        <PercentBar percent={props.percent} compact />
      ) : null}
    </Stack>
  )
}
