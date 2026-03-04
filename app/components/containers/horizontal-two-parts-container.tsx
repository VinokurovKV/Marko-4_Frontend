// Project
import {
  type ContainerWithTitleProps,
  ContainerWithTitle
} from './container-with-title'
// React
import * as React from 'react'
// Material UI
import Grid from '@mui/material/Grid'

export interface HorizontalTwoPartsContainerProps extends Omit<
  ContainerWithTitleProps,
  'children'
> {
  proportions:
    | 'EQUAL'
    | 'ONE_TWO'
    | 'ONE_THREE'
    | 'FIVE_SEVEN'
    | 'SEVEN_FIVE'
    | 'TWO_ONE'
    | 'ONE_ZERO'
  children: [React.ReactNode, React.ReactNode]
}

export function HorizontalTwoPartsContainer(
  props: HorizontalTwoPartsContainerProps
) {
  return (
    <ContainerWithTitle title={props.title}>
      <Grid container spacing={2} sx={{ height: '100%', overflow: 'hidden' }}>
        <Grid
          size={
            props.proportions === 'EQUAL'
              ? 6
              : props.proportions === 'ONE_TWO'
                ? 4
                : props.proportions === 'ONE_THREE'
                  ? 3
                  : props.proportions === 'FIVE_SEVEN'
                    ? 5
                    : props.proportions === 'SEVEN_FIVE'
                      ? 7
                      : props.proportions === 'TWO_ONE'
                        ? 8
                        : 12
          }
          sx={{ height: '100%' }}
        >
          {props.children[0]}
        </Grid>
        <Grid
          size={
            props.proportions === 'EQUAL'
              ? 6
              : props.proportions === 'ONE_TWO'
                ? 8
                : props.proportions === 'ONE_THREE'
                  ? 9
                  : props.proportions === 'FIVE_SEVEN'
                    ? 7
                    : props.proportions === 'SEVEN_FIVE'
                      ? 5
                      : props.proportions === 'TWO_ONE'
                        ? 4
                        : 0
          }
          sx={{ height: '100%' }}
        >
          {props.children[1]}
        </Grid>
      </Grid>
    </ContainerWithTitle>
  )
}
