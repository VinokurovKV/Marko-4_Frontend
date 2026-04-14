// React router
import { Link } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import type { TooltipProps } from '@mui/material/Tooltip'
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
  semiTransparent?: boolean
  hoverPreview?: {
    renderContent: (active: boolean) => React.ReactNode
    enterDelay?: number
    leaveDelay?: number
    placement?: TooltipProps['placement']
  }
}

export function GridRefCell(props: GridRefCellProps) {
  const theme = useTheme()
  const [hoverPreviewIsOpen, setHoverPreviewIsOpen] = React.useState(false)

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      event.stopPropagation()
    },
    []
  )

  if (props.text === undefined) {
    return null
  }

  const text = props.disableCapitalize
    ? props.text
    : capitalize(props.text, true)

  const content =
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
            textTransform: 'none',
            fontWeight: props.header ? 500 : undefined,
            color: props.header ? theme.palette.text.primary : undefined,
            opacity: props.semiTransparent === true ? 0.4 : undefined
          }}
        >
          {text}
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
          fontWeight: props.header ? 500 : undefined,
          color: props.header
            ? theme.palette.text.primary
            : props.semiTransparent
              ? 'rgb(175, 199, 234)'
              : undefined,
          ':hover': {
            bgcolor:
              theme.palette.mode === 'light'
                ? 'rgb(239, 244, 251)'
                : 'rgb(40, 47, 54)'
          }
        }}
      >
        {text}
      </Button>
    )

  if (props.hoverPreview === undefined) {
    return content
  }

  return (
    <Tooltip
      title={props.hoverPreview.renderContent(hoverPreviewIsOpen)}
      placement={props.hoverPreview.placement ?? 'right-start'}
      enterDelay={props.hoverPreview.enterDelay ?? 1100}
      leaveDelay={props.hoverPreview.leaveDelay ?? 100}
      onOpen={() => {
        setHoverPreviewIsOpen(true)
      }}
      onClose={() => {
        setHoverPreviewIsOpen(false)
      }}
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 'none',
            p: 0,
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[6]
          }
        }
      }}
    >
      <span style={{ display: 'block', width: '100%' }}>{content}</span>
    </Tooltip>
  )
}
