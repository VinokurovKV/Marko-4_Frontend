// Project
import { type FileFormat, convertFileFormatToExtension } from '@common/formats'
import type { ReadTestReportWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/test-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
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

type Item =
  DtoWithoutEnums<ReadTestReportWithUpToTertiaryPropsSuccessResultDto>['items'][0]

export interface ColumnViewerFileProps extends Item {
  getFileBlob: (id: number) => Promise<Blob | null>
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
    <Stack spacing={-0.5} p={0}>
      <Typography
        sx={{
          fontWeight: 'bold'
        }}
      >
        {capitalize(props.name, true)}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0} p={0}>
        <Tooltip title="Скачать">
          <IconButton onClick={handleClick} size="small">
            <FileDownloadIcon sx={{ width: 27, height: 27 }} />
          </IconButton>
        </Tooltip>
        <Typography>{`(${props.size} байт)`}</Typography>
      </Stack>
    </Stack>
  )
}
