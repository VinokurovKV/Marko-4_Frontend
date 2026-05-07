// Project
import { convertNumberOfBytesToStr } from '@common/utilities'
import { type FileFormat, convertFileFormatToExtension } from '@common/formats'
import type { TestReportTertiary } from '~/types'
import { downloadFileFromBlob } from '~/utilities'
import { useNotifier } from '~/providers/notifier'
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
import * as JSZip from 'jszip'
import XMLViewer from 'react-xml-viewer'

type Item = TestReportTertiary['items'][0]

export interface ColumnViewerFileProps extends Omit<Item, 'size' | 'time'> {
  getFileBlob: (id: number) => Promise<Blob | null>
  field?: string
  size?: number
  time?: Date
  hideTitle?: boolean
  browseMode?: 'ZIP_XML'
}

export function ColumnViewerFile(props: ColumnViewerFileProps) {
  const notifier = useNotifier()

  const [popoverAnchorEl, setPopoverAnchorEl] =
    React.useState<HTMLButtonElement | null>(null)
  const [popoverRawText, setPopoverRawText] = React.useState<string | null>(
    null
  )

  const handleDownloadClick = React.useCallback(() => {
    void (async () => {
      const blob = await props.getFileBlob(props.id)
      const ext = convertFileFormatToExtension(props.format as FileFormat) ?? ''
      const fileName = `${props.name}.${ext}`
      if (blob !== null) {
        downloadFileFromBlob(blob, fileName)
      }
    })()
  }, [props])

  const handlePopoverClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setPopoverAnchorEl(event.currentTarget)
      if (props.browseMode === 'ZIP_XML') {
        void (async () => {
          const blob = await props.getFileBlob(props.id)
          const ext =
            convertFileFormatToExtension(props.format as FileFormat) ?? ''
          if (blob === null) {
            notifier.showError('файл отсутствует')
            return
          }
          if (ext !== 'zip') {
            notifier.showError('файл не является ZIP-архивом')
            return
          }
          const zip = await (async () => {
            try {
              return await JSZip.loadAsync(blob)
            } catch (error) {
              notifier.showError(error, 'ошибка при разархивировании ZIP-файла')
              throw error
            }
          })()
          const fileNames = Object.keys(zip.files)
          if (fileNames.length !== 1) {
            notifier.showError('Количество файлов в ZIP-архиве на равно одному')
            return
          }
          const fileName = fileNames[0]
          if (fileName.endsWith('xml') === false) {
            notifier.showError(`Формат файл внутри ZIP-архива не равен 'XML'`)
            return
          }
          try {
            const text = await zip.file(fileNames[0])!.async('string')
            setPopoverRawText(text)
          } catch (error) {
            notifier.showError(error, 'ошибка при чтении XML-файла')
            throw error
          }
        })()
      }
    },
    [props.browseMode, props.getFileBlob, notifier]
  )

  const handlePopoverClose = React.useCallback(() => {
    setPopoverAnchorEl(null)
    setPopoverRawText(null)
  }, [])

  const popoverIsOpen = Boolean(popoverAnchorEl)
  const popoverId = popoverIsOpen ? 'popover' : undefined

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
          <IconButton onClick={handleDownloadClick} size="medium">
            <FileDownloadIcon sx={{ width: 27, height: 27 }} />
          </IconButton>
        </Tooltip>
        {props.browseMode !== undefined ? (
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
  )
}
