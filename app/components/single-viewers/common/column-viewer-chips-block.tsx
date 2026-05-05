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
    isActive?: boolean
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

  const getVariant = (item: ColumnViewerChipsBlockProps['items'][number]) =>
    item.isActive ? 'filled' : 'outlined'

  const getSx = (item: ColumnViewerChipsBlockProps['items'][number]) => ({
    borderColor: item.isActive
      ? theme.palette.primary.main
      : theme.palette.primary.dark,
    backgroundColor: item.isActive ? theme.palette.primary.main : undefined,
    color: item.isActive ? theme.palette.primary.contrastText : undefined,
    ':hover': {
      bgcolor: item.isActive
        ? `${theme.palette.primary.dark} !important`
        : theme.palette.mode === 'light'
          ? 'rgb(239, 244, 251) !important'
          : 'rgb(40, 47, 54) !important'
    }
  })

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
            variant={getVariant(item)}
            // sx={{ borderColor: theme.palette.primary.dark }}
            sx={getSx(item)}
          />
        ) : item.href !== undefined ? (
          <Chip
            key={itemIndex}
            label={getLabel(item)}
            component={Link}
            to={item.href}
            variant={getVariant(item)}
            clickable
            sx={getSx(item)}
          />
        ) : (
          <Chip
            key={itemIndex}
            label={getLabel(item)}
            variant={getVariant(item)}
            clickable
            onClick={item.onClick}
            sx={getSx(item)}
          />
        )
      )}
      {props.items.length === 0 && props.emptyText !== undefined
        ? props.emptyText
        : null}
    </Stack>
  )
}
