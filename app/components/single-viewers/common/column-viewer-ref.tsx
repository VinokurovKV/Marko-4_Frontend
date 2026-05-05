// React router
import { Link } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import type { TooltipProps } from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export interface ColumnViewerRefProps {
  field: string
  text?: string
  href?: string
  disableCapitalize?: boolean
  external?: boolean
  semiTransparent?: boolean
  hoverPreview?: {
    renderContent: (
      active: boolean,
      onReadyChange: (ready: boolean) => void
    ) => React.ReactNode
    enterDelay?: number
    leaveDelay?: number
    placement?: TooltipProps['placement']
  }
}

function prepareHref(href: string) {
  return href.startsWith('http://') || href.startsWith('https://')
    ? href
    : `https://${href}`
}

export function ColumnViewerRef(props: ColumnViewerRefProps) {
  const theme = useTheme()
  const [hoverTargetIsHovered, setHoverTargetIsHovered] = React.useState(false)
  const [tooltipIsOpen, setTooltipIsOpen] = React.useState(false)
  const [previewIsReady, setPreviewIsReady] = React.useState(false)

  const hoverPreviewIsActive = hoverTargetIsHovered || tooltipIsOpen
  const previewIsVisible = hoverPreviewIsActive && previewIsReady

  const handlePreviewReadyChange = React.useCallback((ready: boolean) => {
    setPreviewIsReady((prevReady) => (prevReady === ready ? prevReady : ready))
  }, [])

  React.useEffect(() => {
    setPreviewIsReady(false)
  }, [props.field, props.href, props.text])

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
      {props.text !== undefined
        ? (() => {
            const text = props.disableCapitalize
              ? props.text
              : capitalize(props.text, true)

            const content =
              props.external !== true ? (
                <Button
                  component={Link}
                  to={props.href ?? ''}
                  disabled={props.href === undefined}
                  onClick={handleClick}
                  sx={{
                    justifyContent: 'start',
                    textTransform: 'none',
                    color: props.semiTransparent
                      ? 'rgb(175, 199, 234)'
                      : undefined,
                    ':hover': {
                      bgcolor:
                        theme.palette.mode === 'light'
                          ? 'rgb(239, 244, 251)'
                          : 'rgb(40, 47, 54)'
                    },
                    transform: 'translateY(0.1rem)'
                  }}
                >
                  {text}
                </Button>
              ) : (
                <Button
                  component={'a'}
                  target="_blank"
                  rel="noopener noreferrer"
                  href={props.href !== undefined ? prepareHref(props.href) : ''}
                  onClick={handleClick}
                  sx={{
                    justifyContent: 'start',
                    textTransform: 'none',
                    color: props.semiTransparent
                      ? 'rgb(175, 199, 234)'
                      : undefined,
                    ':hover': {
                      bgcolor:
                        theme.palette.mode === 'light'
                          ? 'rgb(239, 244, 251)'
                          : 'rgb(40, 47, 54)'
                    },
                    transform: 'translateY(0.1rem)'
                  }}
                >
                  {props.disableCapitalize ? props.href : props.text}
                </Button>
              )

            return props.hoverPreview !== undefined ? (
              <Tooltip
                title={props.hoverPreview.renderContent(
                  hoverPreviewIsActive,
                  handlePreviewReadyChange
                )}
                placement={props.hoverPreview.placement ?? 'right-start'}
                enterDelay={props.hoverPreview.enterDelay ?? 800}
                enterNextDelay={props.hoverPreview.enterDelay ?? 800}
                leaveDelay={props.hoverPreview.leaveDelay ?? 100}
                onOpen={() => {
                  setTooltipIsOpen(true)
                }}
                onClose={() => {
                  setTooltipIsOpen(false)
                }}
                slotProps={{
                  popper: {
                    sx: {
                      visibility: previewIsVisible ? 'visible' : 'hidden',
                      pointerEvents: previewIsVisible ? 'auto' : 'none'
                    }
                  },
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
                <span
                  style={{ display: 'inline-block' }}
                  onMouseEnter={() => {
                    setHoverTargetIsHovered(true)
                  }}
                  onMouseLeave={() => {
                    setHoverTargetIsHovered(false)
                  }}
                >
                  {content}
                </span>
              </Tooltip>
            ) : (
              content
            )
          })()
        : null}
    </Stack>
  )
}
