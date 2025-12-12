// React
import * as React from 'react'
// Material UI
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'

export interface VerticalTwoPartsContainerProps {
  proportions: '50_50' | '45_55' | '30_70'
  children: [React.ReactNode, React.ReactNode]
}

export function VerticalTwoPartsContainer(
  props: VerticalTwoPartsContainerProps
) {
  return (
    <Stack sx={{ height: '100%', overflow: 'hidden' }}>
      <Container
        sx={{
          height:
            props.proportions === '50_50'
              ? '50%'
              : props.proportions === '45_55'
                ? '45%'
                : '30%',
          pl: '0px !important',
          pb: '1rem',
          pr: '0px !important'
        }}
      >
        {props.children[0]}
      </Container>
      <Container
        sx={{
          height:
            props.proportions === '50_50'
              ? '50%'
              : props.proportions === '45_55'
                ? '55%'
                : '70%',
          pl: '0px !important',
          pr: '0px !important'
        }}
      >
        {props.children[1]}
      </Container>
    </Stack>
  )
}
