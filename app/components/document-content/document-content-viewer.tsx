// Project
import type { DocumentPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useChangeDetector } from '~/hooks/change-detector'
import {
  PdfViewer,
  type PdfViewerMode,
  type PdfArea,
  type Rectangle
} from './pdf-viewer'
import { ProjButton } from '../buttons/button'
import { PdfSearchBox } from './pdf-search-box'
import { brand, gray, orange, red } from '~/theme/themePrimitives'
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
import TextField from '@mui/material/TextField'

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
  const [isCreateAreaDialogOpen, setIsCreateAreaDialogOpen] =
    React.useState(false)
  const [, setPendingRectangle] = React.useState<Rectangle | null>(null)
  const [newAreaName, setNewAreaName] = React.useState('')
  const [editingAreaId, setEditingAreaId] = React.useState<number | null>(null)
  const [creatingAreaId, setCreatingAreaId] = React.useState<number | null>(
    null
  )
  const [isAreaDialogClosing, setIsAreaDialogClosing] = React.useState(false)
  const nextAreaIdForDialog = React.useMemo(
    () => getNextAreaId(areas),
    [areas, getNextAreaId]
  )
  const areaIdForDialogPreview = React.useMemo(
    () => creatingAreaId ?? nextAreaIdForDialog,
    [creatingAreaId, nextAreaIdForDialog]
  )
  const [searchText, setSearchText] = React.useState('')
  const [searchTotal, setSearchTotal] = React.useState(0)
  const [searchActiveIndex, setSearchActiveIndex] = React.useState(0)
  const [searchNextRequest, setSearchNextRequest] = React.useState(0)
  const [searchPreviousRequest, setSearchPreviousRequest] = React.useState(0)
  const [isSearchPending, setIsSearchPending] = React.useState(false)

  const handleSearchPendingChange = React.useCallback((isPending: boolean) => {
    setIsSearchPending((prev) => (prev === isPending ? prev : isPending))
  }, [])

  const handleSearchStateChange = React.useCallback(
    ({ total, activeIndex }: { total: number; activeIndex: number }) => {
      setSearchTotal((prev) => (prev === total ? prev : total))
      setSearchActiveIndex((prev) =>
        prev === activeIndex ? prev : activeIndex
      )
    },
    []
  )

  const previousAreaNameForDialog = React.useMemo(() => {
    if (editingAreaId === null) return ''

    return areas.find((a) => a.id === editingAreaId)?.name ?? ''
  }, [areas, editingAreaId])

  const isCreateAreaNameEmpty =
    editingAreaId === null && newAreaName.trim().length === 0

  const isRenameAreaNameEmpty =
    editingAreaId !== null && newAreaName.trim().length === 0

  const showCreateAreaNameEmpty = !isAreaDialogClosing && isCreateAreaNameEmpty

  const showRenameAreaNameEmpty = !isAreaDialogClosing && isRenameAreaNameEmpty

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

  const openCreateAreaDialog = React.useCallback(
    (rectangle: Rectangle) => {
      const nextId = getNextAreaId(areas)

      setAreas((prev) => [
        ...prev,
        {
          id: nextId,
          name: '',
          rectangle
        }
      ])

      setPendingRectangle(rectangle)
      setCreatingAreaId(nextId)
      setEditingAreaId(null)
      setNewAreaName('')
      setIsAreaDialogClosing(false)
      setIsCreateAreaDialogOpen(true)
    },
    [areas, getNextAreaId]
  )

  const openRenameAreaDialog = React.useCallback(
    (areaId: number) => {
      const area = areas.find((a) => a.id === areaId)
      if (!area) return

      setPendingRectangle(null)
      setEditingAreaId(areaId)
      setNewAreaName(area.name)
      setIsAreaDialogClosing(false)
      setIsCreateAreaDialogOpen(true)
    },
    [areas]
  )

  const closeCreateAreaDialog = React.useCallback(() => {
    const wasCreating = creatingAreaId !== null

    if (creatingAreaId !== null) {
      setAreas((prev) => prev.filter((a) => a.id !== creatingAreaId))
    }

    setIsAreaDialogClosing(true)
    setIsCreateAreaDialogOpen(false)

    if (wasCreating) {
      setMode({ type: 'DEFAULT' })
    }
  }, [creatingAreaId])

  const confirmAreaName = React.useCallback(() => {
    const trimmedName = newAreaName.trim()

    if (editingAreaId !== null) {
      const fallbackName = previousAreaNameForDialog
      const resolvedName = trimmedName.length > 0 ? trimmedName : fallbackName

      setAreas((prev) =>
        prev.map((a) =>
          a.id === editingAreaId
            ? {
                ...a,
                name: resolvedName
              }
            : a
        )
      )

      setNewAreaName(resolvedName)
      setIsAreaDialogClosing(true)
      setIsCreateAreaDialogOpen(false)
      return
    }

    if (creatingAreaId === null) return

    const resolvedName =
      trimmedName.length > 0 ? trimmedName : `Область ${creatingAreaId}`

    setAreas((prev) =>
      prev.map((a) =>
        a.id === creatingAreaId
          ? {
              ...a,
              name: resolvedName
            }
          : a
      )
    )

    setNewAreaName(resolvedName)
    setIsAreaDialogClosing(true)
    setIsCreateAreaDialogOpen(false)
    setMode({ type: 'DEFAULT' })
  }, [editingAreaId, creatingAreaId, newAreaName, previousAreaNameForDialog])

  const resetCreateAreaDialogState = React.useCallback(() => {
    setPendingRectangle(null)
    setEditingAreaId(null)
    setCreatingAreaId(null)
    setNewAreaName('')
    setIsAreaDialogClosing(false)
  }, [])

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

  const isAnyTopDialogOpen = isBrowseDialogOpen || isCreateAreaDialogOpen

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
          sx={{
            mb: 1,
            flex: '0 0 auto',
            minWidth: 0,
            position: 'relative',
            zIndex: theme.zIndex.modal + 10
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              ml: 'var(--dcv-toolbar-offset)',
              flexShrink: 0
            }}
          >
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
            {mode.type !== 'DEFAULT' && !isAnyTopDialogOpen && (
              <Typography
                variant="caption"
                sx={{ whiteSpace: 'nowrap', color: brand[600] }}
              >
                Esc — режим по умолчанию
              </Typography>
            )}
          </Box>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexShrink: 0 }}
          >
            <PdfSearchBox
              initialValue={searchText}
              totalMatches={searchTotal}
              activeMatchIndex={searchActiveIndex}
              isSearchPending={isSearchPending}
              onSubmit={(value) => {
                setSearchText(value)
              }}
              onPrevious={() => {
                setSearchPreviousRequest((prev) => prev + 1)
              }}
              onNext={() => {
                setSearchNextRequest((prev) => prev + 1)
              }}
              onClear={() => {
                setSearchText('')
                setSearchTotal(0)
                setSearchActiveIndex(0)
                setIsSearchPending(false)
              }}
            />

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
          </Stack>
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

        <Dialog
          open={isCreateAreaDialogOpen}
          onClose={closeCreateAreaDialog}
          maxWidth="xs"
          fullWidth
          TransitionProps={{
            onExited: resetCreateAreaDialogState
          }}
          PaperProps={{
            sx: (theme) => ({
              backgroundColor:
                theme.palette.mode === 'dark' ? gray[900] : gray[100],
              color: theme.palette.mode === 'dark' ? gray[100] : gray[700],
              borderRadius: 4
            })
          }}
        >
          <DialogTitle
            sx={(theme) => ({
              textAlign: 'center',
              color: theme.palette.mode === 'dark' ? gray[100] : gray[700]
            })}
          >
            {editingAreaId === null ? 'Название области' : 'Изменение названия'}
          </DialogTitle>

          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              label="Название"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              helperText={
                isCreateAreaNameEmpty
                  ? `Название пусто, область будет названа "Область ${areaIdForDialogPreview}"`
                  : isRenameAreaNameEmpty
                    ? `Название пусто, будет возвращено предыдущее: "${previousAreaNameForDialog}"`
                    : ' '
              }
              FormHelperTextProps={{
                sx: isCreateAreaNameEmpty
                  ? {
                      color: orange[400],
                      fontWeight: 500
                    }
                  : isRenameAreaNameEmpty
                    ? {
                        color: red[400],
                        fontWeight: 500
                      }
                    : undefined
              }}
              sx={
                showCreateAreaNameEmpty
                  ? {
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: orange[400]
                        },
                        '&:hover fieldset': {
                          borderColor: orange[400]
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: orange[400]
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: orange[400]
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: orange[400]
                      }
                    }
                  : showRenameAreaNameEmpty
                    ? {
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: red[400]
                          },
                          '&:hover fieldset': {
                            borderColor: red[400]
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: red[400]
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: red[400]
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: red[400]
                        }
                      }
                    : undefined
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  confirmAreaName()
                }
              }}
            />
          </DialogContent>

          <DialogActions>
            <ProjButton onClick={closeCreateAreaDialog}>Закрыть</ProjButton>
            <ProjButton variant="contained" onClick={confirmAreaName}>
              Сохранить
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
              withCaptureAreaButtons={true}
              withRenameAreaButtons={true}
              mode={mode}
              interactionMode={interactionMode}
              searchText={searchText}
              searchNextRequest={searchNextRequest}
              searchPreviousRequest={searchPreviousRequest}
              onSearchPendingChange={handleSearchPendingChange}
              onSearchStateChange={handleSearchStateChange}
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
              onRenameAreaButtonClick={({ areaId }) => {
                openRenameAreaDialog(areaId)
              }}
              onCreateRectangle={({ rectangle }) => {
                openCreateAreaDialog(rectangle)
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
