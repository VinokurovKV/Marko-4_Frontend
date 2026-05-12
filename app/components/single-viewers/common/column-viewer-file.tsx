// Project
import { convertNumberOfBytesToStr } from '@common/utilities'
import { type FileFormat, convertFileFormatToExtension } from '@common/formats'
import type { TestReportTertiary } from '~/types'
import { downloadFileFromBlob } from '~/utilities'
import { useNotifier } from '~/providers/notifier'
import { FileViewer } from '~/components/file-viewer'
// React
import * as React from 'react'
// Material UI
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import VisibilityIcon from '@mui/icons-material/Visibility'
import IconButton from '@mui/material/IconButton'
import { Popover } from '@mui/material'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'
import XMLViewer from 'react-xml-viewer'

type Item = TestReportTertiary['items'][0]

export interface ColumnViewerFileProps extends Omit<Item, 'size' | 'time'> {
  getFileBlob: (id: number) => Promise<Blob | null>
  field?: string
  fieldFull?: string
  size?: number
  time?: Date
  hideTitle?: boolean
  withBrowse?: boolean
}

export function ColumnViewerFile(props: ColumnViewerFileProps) {
  const notifier = useNotifier()

  const [popoverAnchorEl, setPopoverAnchorEl] =
    React.useState<HTMLButtonElement | null>(null)
  const [popoverRawText, setPopoverRawText] = React.useState<string | null>(
    null
  )
  const [fileBlob, setFileBlob] = React.useState<Blob | null>(null)
  const [fileViewerIsActive, setFileViewerIsActive] = React.useState(false)

  const ext = React.useMemo(
    () => convertFileFormatToExtension(props.format as FileFormat) ?? '',
    [props.format]
  )

  const fileName = React.useMemo(
    () => `${props.name}.${ext}`,
    [props.name, ext]
  )

  const handleDownloadClick = React.useCallback(() => {
    void (async () => {
      const blob = await props.getFileBlob(props.id)
      if (blob !== null) {
        downloadFileFromBlob(blob, fileName)
      }
    })()
  }, [props, fileName])

  const handlePopoverClick = React.useCallback(() => {
    void (async () => {
      if (props.withBrowse === true) {
        const blob = await props.getFileBlob(props.id)
        if (blob === null) {
          notifier.showError('файл отсутствует')
          return
        }
        setFileBlob(blob)
        setFileViewerIsActive(true)
      }
    })()
  }, [props.withBrowse, props.getFileBlob, notifier])

  const handlePopoverClose = React.useCallback(() => {
    setPopoverAnchorEl(null)
    setPopoverRawText(null)
  }, [])

  const popoverIsOpen = Boolean(popoverAnchorEl)
  const popoverId = popoverIsOpen ? 'popover' : undefined

  return (
    <>
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
            <IconButton onClick={handleDownloadClick} size="medium">
              <FileDownloadIcon sx={{ width: 27, height: 27 }} />
            </IconButton>
          </Tooltip>
          {props.withBrowse === true ? (
            <>
              <Tooltip title="Просмотреть" sx={{ ml: -1 }}>
                <IconButton onClick={handlePopoverClick} size="medium">
                  <VisibilityIcon sx={{ width: 27, height: 27 }} />
                </IconButton>
              </Tooltip>
              <Popover
                id={popoverId}
                open={popoverIsOpen}
                anchorEl={popoverAnchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
              >
                {popoverRawText !== null ? (
                  <XMLViewer
                    xml={popoverRawText}
                    collapsible={true}
                    showLineNumbers={true}
                  />
                ) : null}
              </Popover>
            </>
          ) : null}
          {props.size !== undefined ? (
            <Typography>{convertNumberOfBytesToStr(props.size)}</Typography>
          ) : null}
        </Stack>
      </Stack>
      <FileViewer
        isActive={fileViewerIsActive}
        setIsActive={setFileViewerIsActive}
        fileTitle={props.fieldFull ?? props.field ?? fileName}
        fileName={fileName}
        fileBlob={fileBlob}
      />
    </>
  )
}
