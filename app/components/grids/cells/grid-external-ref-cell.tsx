// React
import * as React from 'react'
// Material UI
import Button from '@mui/material/Button'
// Other
import capitalize from 'capitalize'

interface GridExternalRefCellProps {
  href?: string | null
  disableCapitalize?: boolean
}

function prepareHref(href: string) {
  return href.startsWith('http://') || href.startsWith('https://')
    ? href
    : `https://${href}`
}

export function GridExternalRefCell(props: GridExternalRefCellProps) {
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      event.stopPropagation()
    },
    []
  )

  return props.href ? (
    <Button
      component={'a'}
      target="_blank"
      rel="noopener noreferrer"
      href={prepareHref(props.href)}
      onClick={handleClick}
      sx={{
        justifyContent: 'start',
        textTransform: 'none'
      }}
    >
      {props.disableCapitalize ? props.href : capitalize(props.href, true)}
    </Button>
  ) : null
}
