// React router
import { Link } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export interface ColumnViewerRefProps {
  field: string
  text?: string
  href?: string
  disableCapitalize?: boolean
}

export function ColumnViewerRef(props: ColumnViewerRefProps) {
  const theme = useTheme()

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      event.stopPropagation()
    },
    []
  )

  return (
    <Stack direction="row" alignItems="center" spacing={1} p={0}>
      <Typography
        sx={{
          fontWeight: 'bold'
        }}
      >
        {capitalize(props.field, true) + ':'}
      </Typography>
      {props.text !== undefined ? (
        <Button
          component={Link}
          to={props.href ?? ''}
          disabled={props.href === undefined}
          onClick={handleClick}
          sx={{
            justifyContent: 'start',
            textTransform: 'none',
            ':hover': {
              bgcolor:
                theme.palette.mode === 'light'
                  ? 'rgb(239, 244, 251)'
                  : 'rgb(40, 47, 54)'
            }
          }}
        >
          {props.disableCapitalize ? props.text : capitalize(props.text, true)}
        </Button>
      ) : null}
    </Stack>
  )
}
