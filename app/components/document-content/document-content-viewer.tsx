// Project
import type { DocumentPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useChangeDetector } from '~/hooks/change-detector'
import { type PdfViewerMode, PdfViewer, type PdfArea } from './pdf-viewer'
// Material UI
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
// React
import * as React from 'react'

const DEFAULT_MODE: PdfViewerMode = {
  type: 'DEFAULT'
}

export interface DocumentContentViewerProps {
  document: DocumentPrimary
}

export function DocumentContentViewer({
  document
}: DocumentContentViewerProps) {
  const theme = useTheme()
  const notifier = useNotifier()
  const [configBlob, setConfigBlob] = React.useState<Blob | null>(null)
  const [configBuffer, setConfigBuffer] = React.useState<ArrayBuffer | null>(
    null
  )
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mode, setMode] = React.useState<PdfViewerMode>(DEFAULT_MODE)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [areas, setAreas] = React.useState<PdfArea[]>([
    {
      id: 1,
      name: 'Пример области #1',
      rectangle: { xMin: 80, xMax: 260, yMin: 140, yMax: 220 }
    }
  ])

  useChangeDetector({
    detectedObjects: [document.id],
    otherDependencies: [document.code, notifier],
    onChange: () => {
      void (async () => {
        try {
          const config = await serverConnector.readDocumentConfig({
            id: document.id
          })
          setConfigBlob(config)
        } catch (error) {
          setConfigBlob(null)
          notifier.showError(
            error,
            `не удалось загрузить документ ${document.code}`
          )
          throw error
        }
      })()
    },
    withInitialAction: true
  })

  React.useEffect(() => {
    void (async () => {
      const buffer =
        configBlob !== null
          ? await new Response(configBlob).arrayBuffer()
          : null
      setConfigBuffer(buffer)
    })()
  }, [configBlob])

  return (
    <Stack
      spacing={1}
      border={`1px solid ${
        theme.palette.mode === 'light'
          ? theme.palette.grey[300]
          : theme.palette.grey.A700
      }`}
      borderRadius="5px"
      p={0}
      sx={{
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        backgroundColor:
          theme.palette.mode === 'light'
            ? 'white'
            : theme.palette.background.default
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {configBuffer !== null ? (
          <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
            <PdfViewer
              data={configBuffer}
              areas={areas}
              clickableAreas={true}
              withUpdateAreaButtons={true}
              withDeleteAreaButtons={true}
              mode={mode}
            />
          </div>
        ) : null}
      </Paper>
    </Stack>
  )
}
