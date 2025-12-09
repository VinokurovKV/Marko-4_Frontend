// React
import * as React from 'react'
// Material UI
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
// Other
import capitalize from 'capitalize'

export interface ColumnViewerProps {
  title?: string
  children: React.ReactNode
}

export function ColumnViewer(props: ColumnViewerProps) {
  const theme = useTheme()
  return (
    <Stack spacing={1} p={0} sx={{ height: '100%' }}>
      {props.title !== undefined ? (
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold'
          }}
        >
          {capitalize(props.title, true)}
        </Typography>
      ) : null}
      <Stack
        spacing={1}
        border={`1px solid ${theme.palette.grey[300]}`}
        borderRadius="5px"
        p={0}
        sx={{ height: '100%', overflow: 'auto', backgroundColor: 'white' }}
      >
        <Paper elevation={0} sx={{ p: 2 }}>
          {props.children}
        </Paper>
      </Stack>
    </Stack>
  )
}
