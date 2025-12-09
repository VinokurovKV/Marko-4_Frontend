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
    disableCapitalizeForHref?: boolean
  }[]
}

export function ColumnViewerChipsBlock(props: ColumnViewerChipsBlockProps) {
  const theme = useTheme()
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
        item.href === undefined ? (
          <Chip
            key={itemIndex}
            label={capitalize(item.text)}
            variant="outlined"
            // sx={{ borderColor: theme.palette.primary.dark }}
          />
        ) : (
          <Chip
            key={itemIndex}
            label={capitalize(item.text)}
            component={Link}
            to={item.href}
            variant="outlined"
            clickable
            sx={{
              borderColor: theme.palette.primary.dark,
              ':hover': {
                bgcolor: 'rgb(239, 244, 251) !important'
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
