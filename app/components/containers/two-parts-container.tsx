// React
import * as React from 'react'
// Material UI
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export interface TwoPartsContainerProps {
  proportions: 'EQUAL' | 'ONE_TWO'
  title?: string
  children: [React.ReactNode, React.ReactNode]
}

export function TwoPartsContainer(props: TwoPartsContainerProps) {
  return (
    <Stack spacing={1} p={0} sx={{ height: '100%', overflow: 'hidden' }}>
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
      <Grid container spacing={2} sx={{ height: '100%', overflow: 'hidden' }}>
        <Grid
          size={props.proportions === 'EQUAL' ? 6 : 4}
          sx={{ height: '100%' }}
        >
          {props.children[0]}
        </Grid>
        <Grid
          size={props.proportions === 'EQUAL' ? 6 : 8}
          sx={{ height: '100%' }}
        >
          {props.children[1]}
        </Grid>
      </Grid>
    </Stack>
  )
}
