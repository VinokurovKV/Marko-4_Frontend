// Project
import { convertNumberOfBytesToStr } from '@common/utilities'
import { type FileFormat, convertFileFormatToExtension } from '@common/formats'
import type { TestReportTertiary } from '~/types'
import { downloadFileFromBlob } from '~/utilities/download-file'
// React
import * as React from 'react'
// Material UI
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

type Item = TestReportTertiary['items'][0]

export interface ColumnViewerFileProps extends Omit<Item, 'size' | 'time'> {
  getFileBlob: (id: number) => Promise<Blob | null>
  field?: string
  size?: number
  time?: Date
  hideTitle?: boolean
}

export function ColumnViewerFile(props: ColumnViewerFileProps) {
  const handleClick = React.useCallback(() => {
    void (async () => {
      const blob = await props.getFileBlob(props.id)
      const ext = convertFileFormatToExtension(props.format as FileFormat) ?? ''
      const fileName = `${props.name}.${ext}`
      if (blob !== null) {
        downloadFileFromBlob(blob, fileName)
      }
    })()
  }, [props])

  return (
    <Stack spacing={-0.5} mt={props.hideTitle ? -1.5 : undefined} p={0}>
      {props.hideTitle !== true ? (
        <Typography
          sx={{
            fontWeight: 'bold'
          }}
        >
          {capitalize(
            props.field !== undefined ? `${props.field}:` : props.name,
            true
          )}
        </Typography>
      ) : (
        false
      )}
      <Stack direction="row" alignItems="center" spacing={0} p={0}>
        <Tooltip title="Скачать">
          <IconButton onClick={handleClick} size="medium">
            <FileDownloadIcon sx={{ width: 27, height: 27 }} />
          </IconButton>
        </Tooltip>
        {props.size !== undefined ? (
          <Typography>{convertNumberOfBytesToStr(props.size)}</Typography>
        ) : null}
      </Stack>
    </Stack>
  )
}
