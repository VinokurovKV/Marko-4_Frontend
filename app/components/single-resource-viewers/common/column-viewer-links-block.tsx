// React router
import { Link } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export interface ColumnViewerLinksBlockProps {
  emptyText?: string
  items: {
    text: string
    secondaryText?: string
    href?: string
    onClick?: () => void
    disableCapitalize?: boolean
  }[]
}

export function ColumnViewerLinksBlock(props: ColumnViewerLinksBlockProps) {
  const theme = useTheme()

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      event.stopPropagation()
    },
    []
  )

  return (
    <Stack
      spacing={0.25}
      divider={<Divider flexItem sx={{ opacity: 0.5 }} />}
      p={0.5}
    >
      {props.items.length > 0 ? (
        props.items.map((item, itemIndex) =>
          item.href !== undefined ? (
            <Button
              key={`${item.href}-${itemIndex}`}
              component={Link}
              to={item.href}
              onClick={(event) => {
                handleClick(event)
                item.onClick?.()
              }}
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                px: 1,
                py: 0.75,
                minWidth: 0,
                ':hover': {
                  bgcolor:
                    theme.palette.mode === 'light'
                      ? 'rgb(239, 244, 251)'
                      : 'rgb(40, 47, 54)'
                }
              }}
            >
              <Stack alignItems="flex-start" spacing={0.25} width="100%">
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, textAlign: 'left', width: '100%' }}
                >
                  {item.disableCapitalize
                    ? item.text
                    : capitalize(item.text, true)}
                </Typography>
                {item.secondaryText !== undefined ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textAlign: 'left', width: '100%' }}
                  >
                    {item.secondaryText}
                  </Typography>
                ) : null}
              </Stack>
            </Button>
          ) : item.onClick !== undefined ? (
            <Button
              key={`${item.text}-${itemIndex}`}
              onClick={(event) => {
                handleClick(event)
                item.onClick?.()
              }}
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                px: 1,
                py: 0.75,
                minWidth: 0,
                ':hover': {
                  bgcolor:
                    theme.palette.mode === 'light'
                      ? 'rgb(239, 244, 251)'
                      : 'rgb(40, 47, 54)'
                }
              }}
            >
              <Stack alignItems="flex-start" spacing={0.25} width="100%">
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, textAlign: 'left', width: '100%' }}
                >
                  {item.disableCapitalize
                    ? item.text
                    : capitalize(item.text, true)}
                </Typography>
                {item.secondaryText !== undefined ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textAlign: 'left', width: '100%' }}
                  >
                    {item.secondaryText}
                  </Typography>
                ) : null}
              </Stack>
            </Button>
          ) : (
            <Stack
              key={`${item.text}-${itemIndex}`}
              spacing={0.25}
              px={1}
              py={0.75}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.disableCapitalize
                  ? item.text
                  : capitalize(item.text, true)}
              </Typography>
              {item.secondaryText !== undefined ? (
                <Typography variant="caption" color="text.secondary">
                  {item.secondaryText}
                </Typography>
              ) : null}
            </Stack>
          )
        )
      ) : props.emptyText !== undefined ? (
        <Typography textAlign="center">{props.emptyText}</Typography>
      ) : null}
    </Stack>
  )
}
