// Project
import type { TestReportTertiary } from '~/types'
import { formatTime } from '~/utilities'
// Material UI
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

type Message = TestReportTertiary['messages'][0]

export interface ColumnViewerMessageProps {
  message: Message
}

export function ColumnViewerMessage({ message }: ColumnViewerMessageProps) {
  const status = message.status
  return (
    <Stack spacing={-0.3} p={0.7}>
      <Typography
        fontSize={'0.9rem'}
        sx={{
          fontWeight: 'bold'
        }}
      >
        {`${formatTime(message.time)} `}
      </Typography>
      <Typography
        fontSize={'0.9rem'}
        lineHeight={1.2}
        color={
          status === 'SUCCESS'
            ? 'success'
            : status === 'WARNING'
              ? 'warning'
              : status === 'ERROR'
                ? 'error'
                : undefined
        }
      >
        {capitalize(message.text, true)}
      </Typography>
    </Stack>
  )
}
