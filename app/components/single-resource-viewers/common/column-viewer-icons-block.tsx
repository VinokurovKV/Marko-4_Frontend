// React
import * as React from 'react'
// Material UI
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export interface ColumnViewerIconsBlockProps {
  emptyText?: string
  items: {
    Icon: React.ReactNode
    text?: string | number
  }[]
}

export function ColumnViewerIconsBlock(props: ColumnViewerIconsBlockProps) {
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
      {props.items.map((item, itemIndex) => (
        <Stack
          key={itemIndex}
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.5}
        >
          {item.Icon}
          {item.text !== undefined ? (
            <Typography>{`- ${item.text}`}</Typography>
          ) : null}
        </Stack>
      ))}
      {props.items.length === 0 && props.emptyText !== undefined
        ? props.emptyText
        : null}
    </Stack>
  )
}
