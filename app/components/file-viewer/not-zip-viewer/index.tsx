// Project
import { downloadFileFromBlob } from '~/utilities'
import { useNotifier } from '~/providers/notifier'
import { SUPPORTED_IMAGE_EXTENSIONS, ImageFileViewer } from './image-viewer'
import { JsonFileViewer } from './json-viewer'
import { MarkdownFileViewer } from './markdown-viewer'
import { XcfgFileViewer } from './xcfg-viewer'
import { XmlFileViewer } from './xml-viewer'
import { PcapFileViewer } from './pcap-viewer'
import { PdfFileViewer } from './pdf-viewer'
import { CodeFileViewer } from './code-viewer'
import { TextFileViewer } from './text-viewer'
import { PlotFileViewer } from './plot-viewer'
// React
import * as React from 'react'
// Material UI
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

export interface NotZipFileViewerProps {
  fileName: string
  fileBlob: Blob
  onFileBlobChange?: (fileBlob: Blob) => Promise<boolean>
}

export function NotZipFileViewer({
  fileName,
  fileBlob,
  onFileBlobChange
}: NotZipFileViewerProps) {
  const theme = useTheme()
  const notifier = useNotifier()

  const isDarkMode = theme.palette.mode === 'dark'

  const [localFileName, setLocalFileName] = React.useState<string | null>(null)
  const [localFileBlob, setLocalFileBlob] = React.useState<Blob | null>(null)
  const [ext, setExt] = React.useState<string | null>(null)
  const [text, setText] = React.useState<string | null>(null)
  const [isTextFile, setIsTextFile] = React.useState<boolean>(false)
  const [isEditMode, setIsEditMode] = React.useState<boolean>(false)
  const [editText, setEditText] = React.useState<string | null>(null)
  const [isBlobFile, setIsBlobFile] = React.useState<boolean>(false)
  const plotViewerRef = React.useRef<HTMLDivElement | null>(null)

  const isPlotFile = React.useMemo(
    () => localFileName?.toLowerCase().endsWith('.plot.json') === true,
    [localFileName]
  )

  React.useEffect(() => {
    setIsEditMode(false)
    setEditText(null)
  }, [fileName])

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
        ['pcap', 'pdf', 'xcfg', ...SUPPORTED_IMAGE_EXTENSIONS].includes(ext)
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
      void navigator.clipboard.writeText(editText ?? text)
      notifier.showInfo(
        `текст файла '${localFileName}' скопирован в буфер обмена`
      )
    }
  }, [localFileName, text, editText])

  const handleEditClick = React.useCallback(() => {
    if (text !== null) {
      setIsEditMode(true)
      setEditText(text)
    }
  }, [text])

  const handleEditTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value)
  }

  const handleCancelEdit = React.useCallback(() => {
    setIsEditMode(false)
    setEditText(null)
  }, [])

  const handleSaveEdit = React.useCallback(() => {
    void (async () => {
      if (editText !== null && onFileBlobChange !== undefined) {
        const success = await onFileBlobChange(
          new Blob([editText], { type: 'text/plain' })
        )
        if (success) {
          setText(editText)
        }
      }
    })()
  }, [editText])

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

  const handleDownloadPlotPngClick = React.useCallback(() => {
    void (async () => {
      const plotViewer = plotViewerRef.current
      const svg = plotViewer?.querySelector('svg.recharts-surface')
      if (svg === undefined || svg === null || localFileName === null) return

      const plotViewerRect = plotViewer.getBoundingClientRect()
      const svgRect = svg.getBoundingClientRect()
      const title = plotViewer.querySelector('h6')
      const titleRect = title?.getBoundingClientRect()
      if (
        plotViewerRect.width === 0 ||
        plotViewerRect.height === 0 ||
        svgRect.width === 0 ||
        svgRect.height === 0
      ) {
        return
      }

      const clonedSvg = svg.cloneNode(true) as SVGElement
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      clonedSvg.setAttribute('width', svgRect.width.toString())
      clonedSvg.setAttribute('height', svgRect.height.toString())

      const svgText = new XMLSerializer().serializeToString(clonedSvg)
      const svgBlob = new Blob([svgText], {
        type: 'image/svg+xml;charset=utf-8'
      })
      const svgUrl = URL.createObjectURL(svgBlob)
      const image = new Image()

      try {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve()
          image.onerror = () => reject(new Error('не удалось подготовить PNG'))
          image.src = svgUrl
        })

        const pixelRatio = window.devicePixelRatio || 1
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(plotViewerRect.width * pixelRatio)
        canvas.height = Math.round(plotViewerRect.height * pixelRatio)
        const context = canvas.getContext('2d')
        if (context === null) return

        context.scale(pixelRatio, pixelRatio)
        context.fillStyle = getComputedStyle(plotViewer).backgroundColor
        context.fillRect(0, 0, plotViewerRect.width, plotViewerRect.height)

        if (title !== null && titleRect !== undefined) {
          const titleStyle = getComputedStyle(title)
          context.fillStyle = titleStyle.color
          context.font = `${titleStyle.fontWeight} ${titleStyle.fontSize} ${titleStyle.fontFamily}`
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.fillText(
            title.textContent ?? '',
            titleRect.left - plotViewerRect.left + titleRect.width / 2,
            titleRect.top - plotViewerRect.top + titleRect.height / 2
          )
        }

        context.drawImage(
          image,
          svgRect.left - plotViewerRect.left,
          svgRect.top - plotViewerRect.top,
          svgRect.width,
          svgRect.height
        )

        const pngBlob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png')
        )
        if (pngBlob === null) return

        downloadFileFromBlob(
          pngBlob,
          localFileName.replace(/\.plot\.json$/i, '-plot-screenshot.png')
        )
      } catch (error) {
        notifier.showError(error, 'ошибка при сохранении PNG графика')
      } finally {
        URL.revokeObjectURL(svgUrl)
      }
    })()
  }, [localFileName, notifier])

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
      {isPlotFile && text !== null && isEditMode === false ? (
        <PlotFileViewer
          fileName={localFileName}
          fileText={text}
          isDarkMode={isDarkMode}
          containerRef={plotViewerRef}
        />
      ) : null}
      {ext === 'json' &&
      isPlotFile === false &&
      text !== null &&
      isEditMode === false ? (
        <JsonFileViewer
          fileName={localFileName}
          fileText={text}
          isDarkMode={isDarkMode}
        />
      ) : null}
      {ext === 'md' && text !== null && isEditMode === false ? (
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
      {(ext === 'py' || ext === 'ts') &&
      text !== null &&
      isEditMode === false ? (
        <CodeFileViewer
          fileName={localFileName}
          fileText={text}
          language={ext === 'py' ? 'python' : 'typescript'}
          isDarkMode={isDarkMode}
        />
      ) : null}
      {(ext === 'log' || ext === 'txt') &&
      text !== null &&
      isEditMode === false ? (
        <TextFileViewer
          fileName={localFileName}
          fileText={text}
          isDarkMode={isDarkMode}
        />
      ) : null}
      {ext === 'xcfg' ? (
        <XcfgFileViewer
          blob={localFileBlob}
          fileName={localFileName}
          isDarkMode={isDarkMode}
        />
      ) : null}
      {ext === 'xml' && text !== null && isEditMode === false ? (
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

      {isTextFile && editText !== null && isEditMode ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%'
          }}
        >
          <textarea
            value={editText}
            onChange={handleEditTextChange}
            style={{
              flex: '1 1 auto',
              minHeight: 0,
              width: '100%',
              fontFamily: 'monospace',
              fontSize: '14px',
              padding: '8px',
              boxSizing: 'border-box',
              resize: 'none',
              borderRadius: '8px',
              outline: 'none',
              boxShadow: 'none',
              borderColor: '#ccc',
              backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
              color: isDarkMode ? '#d4d4d4' : '#000',
              overflow: 'auto'
            }}
          />
          <Stack
            direction="row"
            spacing={1}
            sx={{
              mt: 1,
              justifyContent: 'flex-end',
              flexShrink: 0
            }}
          >
            <Button variant="outlined" size="small" onClick={handleCancelEdit}>
              {editText === text ? 'Закрыть' : 'Отмена'}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveEdit}
              disabled={editText === text}
            >
              Сохранить
            </Button>
          </Stack>
        </div>
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
        {isPlotFile && isEditMode === false ? (
          <Tooltip title="Скачать PNG графика">
            <IconButton
              size="medium"
              onClick={handleDownloadPlotPngClick}
              sx={{ transform: 'translateX(-5px)' }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        ) : null}
        {isTextFile ? (
          <Tooltip
            title={`Скопировать текст${isEditMode ? ' измененного' : ''} файла`}
          >
            <IconButton
              size="medium"
              onClick={handleCopyClick}
              sx={{ transform: 'translateX(-5px)' }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        ) : null}
        {isTextFile && onFileBlobChange !== undefined ? (
          <Tooltip title="Изменить файл">
            <IconButton
              size="medium"
              onClick={handleEditClick}
              sx={{ transform: 'translateX(-5px)' }}
              disabled={isEditMode}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        ) : null}
        <Tooltip title={`Скачать${isEditMode ? ' исходный' : ''} файл`}>
          <IconButton
            size="medium"
            onClick={handleDownloadClick}
            sx={{ transform: 'translateX(-5px)' }}
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  ) : null
}
