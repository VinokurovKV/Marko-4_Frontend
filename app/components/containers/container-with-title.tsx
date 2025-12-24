// React
import * as React from 'react'
// Material UI
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export interface ContainerWithTitleProps {
  title?: string | [string, string]
  children: React.ReactNode
}

export function ContainerWithTitle(props: ContainerWithTitleProps) {
  return (
    <Stack spacing={1} p={0} sx={{ height: '100%', overflow: 'hidden' }}>
      {props.title !== undefined ? (
        <Stack direction="row">
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold'
            }}
          >
            {capitalize(
              props.title instanceof Array ? props.title[0] : props.title,
              true
            )}
          </Typography>
          {props.title instanceof Array ? (
            <Typography
              variant="h5"
              color="primary"
              sx={{
                ml: 1,
                fontWeight: 'bold'
              }}
            >
              {capitalize(props.title[1], true)}
            </Typography>
          ) : null}
        </Stack>
      ) : null}
      {props.children}
    </Stack>
  )
}
