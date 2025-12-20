// Project
import { PercentBar } from '~/components/percent-bar'
// Material UI
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export type ColumnViewerPercentProps = {
  field: string
} & (
  | {
      percent: number | null
    }
  | {
      fraction: string | null
    }
)

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
      {'percent' in props &&
      props.percent !== undefined &&
      props.percent !== null ? (
        <PercentBar percent={props.percent} compact />
      ) : null}
      {'fraction' in props &&
      props.fraction !== undefined &&
      props.fraction !== null ? (
        <PercentBar fraction={props.fraction} compact />
      ) : null}
    </Stack>
  )
}
