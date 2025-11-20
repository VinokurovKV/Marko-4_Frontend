// React router
import { Link } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
// Other
import capitalize from 'capitalize'

interface GridRefCellProps {
  refObjectId: number
  text?: string
  hrefPrefix: string
  header?: boolean
  disableCapitalize?: boolean
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
    <Button
      component={Link}
      to={`${props.hrefPrefix}/${props.refObjectId}`}
      onClick={handleClick}
      sx={{
        justifyContent: 'start',
        textTransform: props.disableCapitalize ? 'none' : undefined,
        fontWeight: props.header ? 'bold' : undefined,
        color: props.header ? theme.palette.text.primary : undefined
      }}
    >
      {props.disableCapitalize ? props.text : capitalize(props.text)}
    </Button>
  ) : null
}
