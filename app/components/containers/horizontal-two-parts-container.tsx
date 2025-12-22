// React
import * as React from 'react'
// Material UI
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export interface HorizontalTwoPartsContainerProps {
  proportions:
    | 'EQUAL'
    | 'ONE_TWO'
    | 'ONE_THREE'
    | 'FIVE_SEVEN'
    | 'SEVEN_FIVE'
    | 'TWO_ONE'
    | 'ONE_ZERO'
  title?: string | [string, string]
  children: [React.ReactNode, React.ReactNode]
}

export function HorizontalTwoPartsContainer(
  props: HorizontalTwoPartsContainerProps
) {
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
    </Stack>
  )
}
