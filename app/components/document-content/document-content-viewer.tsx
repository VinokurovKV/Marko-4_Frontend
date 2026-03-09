// Project
import type { DocumentPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useChangeDetector } from '~/hooks/change-detector'
import { PdfViewer, type PdfViewerMode, type PdfArea } from './pdf-viewer'
import { ProjButton } from '../buttons/button'
// Styles
import './styles.css'
// React
import * as React from 'react'
// Material UI
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import { useTheme } from '@mui/material/styles'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import GridOnIcon from '@mui/icons-material/GridOn'
import TextSnippetIcon from '@mui/icons-material/TextSnippet'
import Box from '@mui/material/Box'

const DEFAULT_MODE: PdfViewerMode = { type: 'DEFAULT' }

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

  const [mode, setMode] = React.useState<PdfViewerMode>(DEFAULT_MODE)
  const [areas, setAreas] = React.useState<PdfArea[]>([])

  type InteractionMode = 'AREAS' | 'TEXT'

  const [interactionMode, setInteractionMode] =
    React.useState<InteractionMode>('AREAS')

  const isAreasMode = interactionMode === 'AREAS'

  React.useEffect(() => {
    setAreas([])
  }, [document.id])

  const getNextAreaId = React.useCallback((list: PdfArea[]) => {
    const used = new Set(list.map((a) => a.id))
    let id = 1
    while (used.has(id)) id++
    return id
  }, [])

  const [isBrowseDialogOpen, setIsBrowseDialogOpen] = React.useState(false)
  const [browseAreaId, setBrowseAreaId] = React.useState<number | null>(null)

  const openBrowseDialog = React.useCallback(() => {
    if (areas.length === 0) return

    const currentId =
      mode.type === 'BROWSE_AREA' || mode.type === 'UPDATE_AREA_RECTANGLE'
        ? mode.areaId
        : null

    const initial =
      currentId !== null && areas.some((a) => a.id === currentId)
        ? currentId
        : [...areas].sort((a, b) => a.id - b.id)[0].id

    setBrowseAreaId(initial)
    setIsBrowseDialogOpen(true)
  }, [areas, mode])

  const closeBrowseDialog = React.useCallback(() => {
    setIsBrowseDialogOpen(false)
  }, [])

  const goToSelectedArea = React.useCallback(() => {
    if (browseAreaId === null) return
    setMode({ type: 'BROWSE_AREA', areaId: browseAreaId })
    setIsBrowseDialogOpen(false)
  }, [browseAreaId])

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

  const rootClassName =
    theme.palette.mode === 'light'
      ? 'dcv-root dcv-root--light'
      : 'dcv-root dcv-root--dark'

  return (
    <div className={rootClassName}>
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
        <Stack
          direction="row"
          alignItems="center"
          sx={{ mb: 1, flex: '0 0 auto' }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <ProjButton
              variant="contained"
              onClick={openBrowseDialog}
              disabled={!isAreasMode || areas.length === 0}
            >
              Просмотр области
            </ProjButton>

            <ProjButton
              variant={
                isAreasMode && mode.type === 'CREATE_RECTANGLE'
                  ? 'contained'
                  : 'outlined'
              }
              onClick={() => {
                if (!isAreasMode) return
                setMode({ type: 'CREATE_RECTANGLE' })
              }}
              disabled={!isAreasMode}
            >
              Создать область
            </ProjButton>
          </Stack>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              minWidth: 0
            }}
          >
            {mode.type !== 'DEFAULT' && (
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'nowrap', color: 'info.main' }}
              >
                Esc — режим по умолчанию
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ProjButton
              variant="outlined"
              title={
                interactionMode === 'AREAS'
                  ? 'Режим: просмотр областей'
                  : 'Режим: чтение текста'
              }
              aria-label="Переключить режим"
              onClick={() => {
                setMode({ type: 'DEFAULT' })
                setInteractionMode((prev) =>
                  prev === 'AREAS' ? 'TEXT' : 'AREAS'
                )
              }}
              sx={{ minWidth: 0, px: 1 }}
            >
              {interactionMode === 'AREAS' ? (
                <GridOnIcon fontSize="small" />
              ) : (
                <TextSnippetIcon fontSize="small" />
              )}
            </ProjButton>
          </Box>
        </Stack>

        <Dialog
          open={isBrowseDialogOpen}
          onClose={closeBrowseDialog}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Просмотр области</DialogTitle>

          <DialogContent>
            {areas.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Нет созданных областей.
              </Typography>
            ) : (
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel id="browse-area-select-label">Область</InputLabel>
                <Select
                  labelId="browse-area-select-label"
                  label="Область"
                  value={browseAreaId ?? ''}
                  onChange={(e) => setBrowseAreaId(Number(e.target.value))}
                >
                  {[...areas]
                    .sort((a, b) => a.id - b.id)
                    .map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.id} — {a.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}
          </DialogContent>

          <DialogActions>
            <ProjButton onClick={closeBrowseDialog}>Отмена</ProjButton>
            <ProjButton
              variant="contained"
              onClick={goToSelectedArea}
              disabled={browseAreaId === null}
            >
              Перейти
            </ProjButton>
          </DialogActions>
        </Dialog>

        <Divider sx={{ mb: 1 }} />

        <div className="dcv-viewer-container">
          {configBuffer !== null ? (
            <PdfViewer
              data={configBuffer}
              areas={areas}
              clickableAreas={true}
              withUpdateAreaButtons={true}
              withDeleteAreaButtons={true}
              mode={mode}
              interactionMode={interactionMode}
              onAreaClick={({ areaId }) =>
                setMode({ type: 'BROWSE_AREA', areaId })
              }
              onUpdateAreaButtonClick={({ areaId }) =>
                setMode({ type: 'UPDATE_AREA_RECTANGLE', areaId })
              }
              onDeleteAreaButtonClick={({ areaId }) => {
                setAreas((prev) => prev.filter((a) => a.id !== areaId))
                setMode((prevMode) => {
                  if (
                    (prevMode.type === 'BROWSE_AREA' ||
                      prevMode.type === 'UPDATE_AREA_RECTANGLE') &&
                    prevMode.areaId === areaId
                  ) {
                    return { type: 'DEFAULT' }
                  }
                  return prevMode
                })
              }}
              onCreateRectangle={({ rectangle }) => {
                setAreas((prev) => {
                  const id = getNextAreaId(prev)
                  return [...prev, { id, name: `Область ${id}`, rectangle }]
                })
                setMode({ type: 'DEFAULT' })
              }}
              onCreateRectangleCancel={() => setMode({ type: 'DEFAULT' })}
              onBrowseAreaCancel={() => setMode({ type: 'DEFAULT' })}
              onUpdateAreaRectangle={({ areaId, rectangle }) => {
                setAreas((prev) =>
                  prev.map((a) => (a.id === areaId ? { ...a, rectangle } : a))
                )
              }}
              onUpdateAreaRectangleCancel={() => setMode({ type: 'DEFAULT' })}
            />
          ) : null}
        </div>
      </Paper>
    </div>
  )
}
