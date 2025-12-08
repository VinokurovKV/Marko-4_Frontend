// React
import * as React from 'react'
// Material UI
import Grid from '@mui/material/Grid'

export interface TwoPartsContainerProps {
  children: [React.ReactNode, React.ReactNode]
}

export function TwoPartsContainer(props: TwoPartsContainerProps) {
  return (
    <Grid container spacing={1.5} sx={{ height: '100%', overflow: 'hidden' }}>
      <Grid size={4} sx={{ height: '100%' }}>
        {props.children[0]}
      </Grid>
      <Grid size={8}>{props.children[1]}</Grid>
    </Grid>
  )
}
