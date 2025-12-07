// React
import * as React from 'react'
// Material UI
import Stack from '@mui/material/Stack'

export interface TwoPartsContainerProps {
  children: [React.ReactNode, React.ReactNode]
}

export function TwoPartsContainer(props: TwoPartsContainerProps) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      p={4}
      sx={{ width: '100%', height: '100%' }}
    >
      {props.children}
    </Stack>
  )
}
