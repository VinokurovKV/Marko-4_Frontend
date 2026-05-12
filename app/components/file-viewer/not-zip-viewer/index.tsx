// Project
import { downloadFileFromBlob } from '~/utilities'
import { useNotifier } from '~/providers/notifier'
import { SUPPORTED_IMAGE_EXTENSIONS, ImageFileViewer } from './image-viewer'
import { JsonFileViewer } from './json-viewer'
import { MarkdownFileViewer } from './markdown-viewer'
// import { XcfgFileViewer } from './xcfg-viewer'
import { XmlFileViewer } from './xml-viewer'
import { PcapFileViewer } from './pcap-viewer'
import { PdfFileViewer } from './pdf-viewer'
import { CodeFileViewer } from './code-viewer'
import { TextFileViewer } from './text-viewer'
// React
import * as React from 'react'
// Material UI
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

export interface NotZipFileViewerProps {
  fileName: string
  fileBlob: Blob
}

export function NotZipFileViewer({
  fileName,
  fileBlob
}: NotZipFileViewerProps) {
  const theme = useTheme()
  const notifier = useNotifier()

  const isDarkMode = theme.palette.mode === 'dark'

  const [localFileName, setLocalFileName] = React.useState<string | null>(null)
  const [localFileBlob, setLocalFileBlob] = React.useState<Blob | null>(null)
  const [ext, setExt] = React.useState<string | null>(null)
  const [text, setText] = React.useState<string | null>(null)
  const [isTextFile, setIsTextFile] = React.useState<boolean>(false)
  const [isBlobFile, setIsBlobFile] = React.useState<boolean>(false)

  React.useEffect(() => {
    void (async () => {
      const localFileName = fileName
      const localFileBlob = fileBlob
      const ext =
        fileName !== null
          ? fileName.includes('.')
            ? fileName.split('.').at(-1)!
            : null
          : null
      const isTextFile =
        ext !== null &&
        ['json', 'log', 'md', 'py', 'ts', 'txt', 'xml'].includes(ext)
      const isBlobFile =
        ext !== null &&
        ['pcap', 'pdf' /*, 'xcfg'*/, ...SUPPORTED_IMAGE_EXTENSIONS].includes(
          ext
        )
      if (isTextFile === false) {
        setLocalFileName(localFileName)
        setLocalFileBlob(localFileBlob)
        setExt(ext)
        setText(null)
        setIsTextFile(isTextFile)
        setIsBlobFile(isBlobFile)
      } else {
        try {
          const text = await fileBlob.text()
          setLocalFileName(localFileName)
          setLocalFileBlob(localFileBlob)
          setExt(ext)
          setText(text)
          setIsTextFile(isTextFile)
          setIsBlobFile(isBlobFile)
        } catch (error) {
          notifier.showError(
            error,
            `ошибка при преобразовании данных файла '${fileName}' в строку`
          )
          throw error
        }
      }
    })()
  }, [fileName, fileBlob])

  const isUnsupportedFormat = React.useMemo(
    () => isTextFile === false && isBlobFile === false,
    [isTextFile, isBlobFile]
  )

  const handleCopyClick = React.useCallback(() => {
    if (text !== null) {
      void navigator.clipboard.writeText(text)
      notifier.showInfo(
        `текст файла '${localFileName}' скопирован в буфер обмена`
      )
    }
  }, [localFileName, text])

  const handleDownloadClick = React.useCallback(() => {
    if (localFileBlob !== null && localFileName !== null) {
      try {
        downloadFileFromBlob(localFileBlob, localFileName)
      } catch (error) {
        notifier.showError(
          error,
          `ошибка при сохранении файла '${localFileName}'`
        )
        throw error
      }
    }
  }, [localFileName, localFileBlob])

  return localFileName !== null ? (
    <Stack spacing={1.5} p={0} sx={{ height: '100%' }}>
      {ext !== null &&
      (SUPPORTED_IMAGE_EXTENSIONS as unknown as string[]).includes(ext) ? (
        <ImageFileViewer
          blob={localFileBlob}
          fileName={localFileName}
          isDarkMode={isDarkMode}
        />
      ) : null}
      {ext === 'json' && text !== null ? (
        <JsonFileViewer
          fileName={localFileName}
          fileText={text}
          isDarkMode={isDarkMode}
        />
      ) : null}
      {ext === 'md' && text !== null ? (
        <MarkdownFileViewer
          fileName={localFileName}
          fileText={text}
          isDarkMode={isDarkMode}
        />
      ) : null}
      {ext === 'pcap' ? (
        <PcapFileViewer
          pcapBlob={localFileBlob}
          fileName={localFileName}
          isDarkMode={isDarkMode}
        />
      ) : null}
      {ext === 'pdf' ? (
        <PdfFileViewer
          blob={localFileBlob}
          fileName={localFileName}
          isDarkMode={isDarkMode}
        />
      ) : null}
      {(ext === 'py' || ext === 'ts') && text !== null ? (
        <CodeFileViewer
          fileName={localFileName}
          fileText={text}
          language={ext === 'py' ? 'python' : 'typescript'}
          isDarkMode={isDarkMode}
        />
      ) : null}
      {(ext === 'log' || ext === 'txt') && text !== null ? (
        <TextFileViewer
          fileName={localFileName}
          fileText={text}
          isDarkMode={isDarkMode}
        />
      ) : null}
      {/* {ext === 'xcfg' ? (
        <XcfgFileViewer
          xcfgBlob={localFileBlob}
          fileName={localFileName}
          isDarkMode={isDarkMode}
          debugMode={true}
          onError={(error) => console.error(error)}
        />
      ) : null} */}
      {ext === 'xml' && text !== null ? (
        <XmlFileViewer
          fileName={localFileName}
          fileText={text}
          isDarkMode={isDarkMode}
        />
      ) : null}
      {isUnsupportedFormat ? (
        <Typography color="error">
          {`Формат файла '${localFileName}' не поддерживается просмотрщиком`}
        </Typography>
      ) : null}

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={0.0}
        sx={{
          position: 'absolute',
          right: '20px',
          bottom: '10px'
        }}
      >
        {isTextFile ? (
          <Tooltip title="Скопировать текст файла">
            <IconButton
              size="medium"
              onClick={handleCopyClick}
              sx={{
                transform: 'translateX(-5px)'
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        ) : null}
        <Tooltip title="Скачать файл">
          <IconButton
            size="medium"
            onClick={handleDownloadClick}
            sx={{
              transform: 'translateX(-5px)'
            }}
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  ) : null
}
