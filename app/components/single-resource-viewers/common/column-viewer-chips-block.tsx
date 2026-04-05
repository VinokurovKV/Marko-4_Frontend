// React router
import { Link } from 'react-router'
// Material UI
import { useTheme } from '@mui/material/styles'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
// Other
import capitalize from 'capitalize'

export interface ColumnViewerChipsBlockProps {
  emptyText?: string
  items: {
    text: string
    href?: string
    onClick?: () => void
    disableCapitalize?: boolean
    disableCapitalizeForHref?: boolean
  }[]
}

export function ColumnViewerChipsBlock(props: ColumnViewerChipsBlockProps) {
  const theme = useTheme()

  const getLabel = (item: ColumnViewerChipsBlockProps['items'][number]) =>
    item.disableCapitalize || item.disableCapitalizeForHref
      ? item.text
      : capitalize(item.text)

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={1}
      p={0.5}
      overflow="auto"
      flexWrap="wrap"
      rowGap={1}
    >
      {props.items.map((item, itemIndex) =>
        item.href === undefined && item.onClick === undefined ? (
          <Chip
            key={itemIndex}
            label={getLabel(item)}
            variant="outlined"
            // sx={{ borderColor: theme.palette.primary.dark }}
          />
        ) : item.href !== undefined ? (
          <Chip
            key={itemIndex}
            label={getLabel(item)}
            component={Link}
            to={item.href}
            variant="outlined"
            clickable
            sx={{
              borderColor: theme.palette.primary.dark,
              ':hover': {
                bgcolor:
                  theme.palette.mode === 'light'
                    ? 'rgb(239, 244, 251) !important'
                    : 'rgb(40, 47, 54) !important'
              }
            }}
          />
        ) : (
          <Chip
            key={itemIndex}
            label={getLabel(item)}
            variant="outlined"
            clickable
            onClick={item.onClick}
            sx={{
              borderColor: theme.palette.primary.dark,
              ':hover': {
                bgcolor:
                  theme.palette.mode === 'light'
                    ? 'rgb(239, 244, 251) !important'
                    : 'rgb(40, 47, 54) !important'
              }
            }}
          />
        )
      )}
      {props.items.length === 0 && props.emptyText !== undefined
        ? props.emptyText
        : null}
    </Stack>
  )
}
