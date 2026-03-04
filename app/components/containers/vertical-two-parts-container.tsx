// Project
import {
  type ContainerWithTitleProps,
  ContainerWithTitle
} from './container-with-title'
// React
import * as React from 'react'
// Material UI
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'

export interface VerticalTwoPartsContainerProps extends Omit<
  ContainerWithTitleProps,
  'children'
> {
  proportions: '30_70' | '45_55' | '50_50' | '60_40' | '100_0' | 'needed_rest'
  children: [React.ReactNode, React.ReactNode]
}

export function VerticalTwoPartsContainer(
  props: VerticalTwoPartsContainerProps
) {
  return (
    <ContainerWithTitle title={props.title}>
      <Stack
        sx={{
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <Container
          sx={{
            height:
              props.proportions === '30_70'
                ? '30%'
                : props.proportions === '45_55'
                  ? '45%'
                  : props.proportions === '50_50'
                    ? '50%'
                    : props.proportions === '60_40'
                      ? '60%'
                      : props.proportions === '100_0'
                        ? '100%'
                        : undefined,
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
              props.proportions === '30_70'
                ? '70%'
                : props.proportions === '45_55'
                  ? '55%'
                  : props.proportions === '50_50'
                    ? '50%'
                    : props.proportions === '60_40'
                      ? '40%'
                      : props.proportions === '100_0'
                        ? '0%'
                        : '100%',
            overflow: props.proportions === 'needed_rest' ? 'auto' : undefined,
            pl: '0px !important',
            pr: '0px !important'
          }}
        >
          {props.children[1]}
        </Container>
      </Stack>
    </ContainerWithTitle>
  )
}
