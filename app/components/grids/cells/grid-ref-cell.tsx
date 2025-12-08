// React router
import { Link } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

interface GridRefCellProps {
  text?: string
  hrefPrefix: string
  hrefPath: number | string
  header?: boolean
  disableCapitalize?: boolean
  disableRef?: boolean
}

export function GridRefCell(props: GridRefCellProps) {
  const theme = useTheme()

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      event.stopPropagation()
    },
    []
  )

  return props.text !== undefined ? (
    props.disableRef === true ? (
      <Button
        disabled
        sx={{
          width: '100%',
          justifyContent: 'start'
        }}
      >
        <Typography
          variant="button"
          sx={{
            fontWeight: props.header ? 'bold' : undefined,
            color: props.header ? theme.palette.text.primary : undefined
          }}
        >
          {capitalize(props.text, true)}
        </Typography>
      </Button>
    ) : (
      <Button
        component={Link}
        to={`${props.hrefPrefix}/${props.hrefPath}`}
        onClick={handleClick}
        sx={{
          width: '100%',
          justifyContent: 'start',
          textTransform: 'none',
          fontWeight: props.header ? 'bold' : undefined,
          color: props.header ? theme.palette.text.primary : undefined,
          ':hover': {
            bgcolor: 'rgb(239, 244, 251)'
          }
        }}
      >
        {props.disableCapitalize ? props.text : capitalize(props.text, true)}
      </Button>
    )
  ) : null
}
