// Material UI
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export interface ColumnViewerTextProps {
  emptyText?: string
  text?: string
}

export function ColumnViewerText(props: ColumnViewerTextProps) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="center">
      {props.text !== undefined ? (
        <Typography whiteSpace="pre-wrap">{props.text}</Typography>
      ) : //   <Typography textAlign="justify" whiteSpace="pre-wrap">
      //   {props.text}
      // </Typography>
      null}
      {props.text === undefined && props.emptyText !== undefined
        ? props.emptyText
        : null}
    </Stack>
  )
}
