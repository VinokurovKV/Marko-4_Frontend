// Project
import type { DocumentTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useChangeDetector } from '~/hooks/change-detector'
import { useFragmentsFiltered } from '~/hooks/resources'
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

type ViewerArea = PdfArea & {
  innerCode: string
  orderNumber: number
  createdFragmentId?: number
}

type CreatingAreaDraft = {
  tempId: number
  orderNumber: number
  rectangle: Rectangle
  configFile?: File
}

type PendingCreatedArea = {
  tempId: number
  orderNumber: number
  name: string
  rectangle: Rectangle
  configFile?: File
  createdFragmentId?: number
}

type OptimisticAreaPatch = {
  name?: string
  rectangle?: Rectangle
}

function toFragmentLocation(rectangle: Rectangle) {
  return {
    xLeft: rectangle.xMin,
    xRight: rectangle.xMax,
    yTop: rectangle.yMin,
    yBottom: rectangle.yMax
  }
}

function parseAreaOrderNumber(innerCode: string): number | null {
  return /^\d+$/.test(innerCode) ? Number(innerCode) : null
}

export interface DocumentContentViewerProps {
  document: DocumentTertiary
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
  const [creatingAreaDraft, setCreatingAreaDraft] =
    React.useState<CreatingAreaDraft | null>(null)
  const [pendingCreatedAreas, setPendingCreatedAreas] = React.useState<
    PendingCreatedArea[]
  >([])
  const [optimisticAreaPatches, setOptimisticAreaPatches] = React.useState<
    Record<number, OptimisticAreaPatch>
  >({})
  const [optimisticDeletedAreaIds, setOptimisticDeletedAreaIds] =
    React.useState<number[]>([])

  type InteractionMode = 'AREAS' | 'TEXT'

  const [interactionMode, setInteractionMode] =
    React.useState<InteractionMode>('AREAS')

  const isAreasMode = interactionMode === 'AREAS'
  const fragments = useFragmentsFiltered(
    'PRIMARY_PROPS',
    document.fragmentIds ?? null
  )

  const [isBrowseDialogOpen, setIsBrowseDialogOpen] = React.useState(false)
  const [browseAreaId, setBrowseAreaId] = React.useState<number | null>(null)
  const [isCreateAreaDialogOpen, setIsCreateAreaDialogOpen] =
    React.useState(false)
  const [newAreaName, setNewAreaName] = React.useState('')
  const [editingAreaId, setEditingAreaId] = React.useState<number | null>(null)
  const [isAreaDialogClosing, setIsAreaDialogClosing] = React.useState(false)

  const areas = React.useMemo<ViewerArea[]>(() => {
    const baseAreas = (fragments ?? [])
      .filter((fragment) => !optimisticDeletedAreaIds.includes(fragment.id))
      .map((fragment, index) => {
        const optimisticPatch = optimisticAreaPatches[fragment.id]
        const orderNumber =
          parseAreaOrderNumber(fragment.innerCode) ?? index + 1

        return {
          id: fragment.id,
          innerCode: fragment.innerCode,
          orderNumber,
          name:
            optimisticPatch?.name ?? fragment.name ?? `Область ${orderNumber}`,
          rectangle: optimisticPatch?.rectangle ?? {
            xMin: fragment.location.xLeft,
            xMax: fragment.location.xRight,
            yMin: fragment.location.yTop,
            yMax: fragment.location.yBottom
          }
        }
      })

    const visiblePendingAreas = pendingCreatedAreas
      .filter(
        (area) =>
          area.createdFragmentId === undefined ||
          !(fragments ?? []).some(
            (fragment) => fragment.id === area.createdFragmentId
          )
      )
      .map((area) => ({
        id: area.tempId,
        innerCode: String(area.orderNumber),
        orderNumber: area.orderNumber,
        name: area.name,
        rectangle: area.rectangle,
        createdFragmentId: area.createdFragmentId
      }))

    if (creatingAreaDraft === null) {
      return [...baseAreas, ...visiblePendingAreas]
    }

    return [
      ...baseAreas,
      ...visiblePendingAreas,
      {
        id: creatingAreaDraft.tempId,
        innerCode: String(creatingAreaDraft.orderNumber),
        orderNumber: creatingAreaDraft.orderNumber,
        name: newAreaName.trim(),
        rectangle: creatingAreaDraft.rectangle
      }
    ]
  }, [
    fragments,
    optimisticDeletedAreaIds,
    optimisticAreaPatches,
    pendingCreatedAreas,
    creatingAreaDraft,
    newAreaName
  ])

  const nextAreaOrderNumber = React.useMemo(
    () => areas.reduce((max, area) => Math.max(max, area.orderNumber), 0) + 1,
    [areas]
  )

  const areaIdForDialogPreview = React.useMemo(
    () => creatingAreaDraft?.orderNumber ?? nextAreaOrderNumber,
    [creatingAreaDraft, nextAreaOrderNumber]
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
        : [...areas].sort((a, b) => a.orderNumber - b.orderNumber)[0].id

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
    (rectangle: Rectangle, configFile?: File) => {
      setCreatingAreaDraft({
        tempId: -Date.now(),
        orderNumber: nextAreaOrderNumber,
        rectangle,
        configFile
      })
      setEditingAreaId(null)
      setNewAreaName('')
      setIsAreaDialogClosing(false)
      setIsCreateAreaDialogOpen(true)
    },
    [nextAreaOrderNumber]
  )

  const openRenameAreaDialog = React.useCallback(
    (areaId: number) => {
      const area = areas.find((a) => a.id === areaId)
      if (!area) return

      setEditingAreaId(areaId)
      setNewAreaName(area.name)
      setIsAreaDialogClosing(false)
      setIsCreateAreaDialogOpen(true)
    },
    [areas]
  )

  const closeCreateAreaDialog = React.useCallback(() => {
    const wasCreating = creatingAreaDraft !== null

    if (creatingAreaDraft !== null) {
      setCreatingAreaDraft(null)
    }

    setIsAreaDialogClosing(true)
    setIsCreateAreaDialogOpen(false)

    if (wasCreating) {
      setMode({ type: 'DEFAULT' })
    }
  }, [creatingAreaDraft])

  const confirmAreaName = React.useCallback(() => {
    const trimmedName = newAreaName.trim()

    void (async () => {
      if (editingAreaId !== null) {
        const fallbackName = previousAreaNameForDialog
        const resolvedName = trimmedName.length > 0 ? trimmedName : fallbackName
        const pendingCreatedArea = pendingCreatedAreas.find(
          (area) => area.tempId === editingAreaId
        )

        if (pendingCreatedArea) {
          setPendingCreatedAreas((prev) =>
            prev.map((area) =>
              area.tempId === editingAreaId
                ? {
                    ...area,
                    name: resolvedName
                  }
                : area
            )
          )
          setNewAreaName(resolvedName)
          setIsAreaDialogClosing(true)
          setIsCreateAreaDialogOpen(false)
          return
        }

        setOptimisticAreaPatches((prev) => ({
          ...prev,
          [editingAreaId]: {
            ...prev[editingAreaId],
            name: resolvedName
          }
        }))
        setNewAreaName(resolvedName)
        setIsAreaDialogClosing(true)
        setIsCreateAreaDialogOpen(false)

        try {
          await serverConnector.updateFragment(
            {
              id: editingAreaId,
              name: resolvedName
            },
            undefined
          )
        } catch (error) {
          setOptimisticAreaPatches((prev) => {
            const next = { ...prev }
            delete next[editingAreaId]
            return next
          })
          notifier.showError(
            error,
            `не удалось изменить фрагмент документа для документа «${document.code}»`
          )
        }
        return
      }

      if (creatingAreaDraft === null) return

      if (!creatingAreaDraft.configFile) {
        notifier.showError(
          `не удалось создать фрагмент документа для документа «${document.code}»`
        )
        return
      }

      const resolvedName =
        trimmedName.length > 0
          ? trimmedName
          : `Область ${creatingAreaDraft.orderNumber}`

      const pendingArea: PendingCreatedArea = {
        tempId: creatingAreaDraft.tempId,
        orderNumber: creatingAreaDraft.orderNumber,
        name: resolvedName,
        rectangle: creatingAreaDraft.rectangle,
        configFile: creatingAreaDraft.configFile
      }

      setPendingCreatedAreas((prev) => [...prev, pendingArea])
      setNewAreaName(resolvedName)
      setIsAreaDialogClosing(true)
      setIsCreateAreaDialogOpen(false)
      setCreatingAreaDraft(null)
      setMode({ type: 'DEFAULT' })

      try {
        const createFragmentSuccessResult =
          await serverConnector.createFragment(
            {
              documentId: document.id,
              innerCode: String(creatingAreaDraft.orderNumber),
              name: resolvedName,
              location: toFragmentLocation(creatingAreaDraft.rectangle)
            },
            creatingAreaDraft.configFile
          )

        const fragmentId = createFragmentSuccessResult.result.createdResourceId

        setBrowseAreaId(fragmentId)
        setPendingCreatedAreas((prev) =>
          prev.map((area) =>
            area.tempId === pendingArea.tempId
              ? {
                  ...area,
                  createdFragmentId: fragmentId
                }
              : area
          )
        )
      } catch (error) {
        setPendingCreatedAreas((prev) =>
          prev.filter((area) => area.tempId !== pendingArea.tempId)
        )
        notifier.showError(
          error,
          `не удалось создать фрагмент документа для документа «${document.code}»`
        )
      }
    })()
  }, [
    editingAreaId,
    newAreaName,
    previousAreaNameForDialog,
    creatingAreaDraft,
    notifier,
    document.id,
    document.code
  ])

  const resetCreateAreaDialogState = React.useCallback(() => {
    setEditingAreaId(null)
    setCreatingAreaDraft(null)
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

  React.useEffect(() => {
    if (fragments === null) return

    setPendingCreatedAreas((prev) =>
      prev.filter(
        (area) =>
          area.createdFragmentId === undefined ||
          !fragments.some((fragment) => fragment.id === area.createdFragmentId)
      )
    )

    setOptimisticDeletedAreaIds((prev) =>
      prev.filter((fragmentId) =>
        fragments.some((fragment) => fragment.id === fragmentId)
      )
    )

    setOptimisticAreaPatches((prev) => {
      const next = { ...prev }
      for (const fragment of fragments) {
        const patch = next[fragment.id]
        if (!patch) continue

        const serverName = fragment.name ?? ''
        const patchNameMatches =
          patch.name === undefined || patch.name === serverName
        const patchRectangleMatches =
          patch.rectangle === undefined ||
          (patch.rectangle.xMin === fragment.location.xLeft &&
            patch.rectangle.xMax === fragment.location.xRight &&
            patch.rectangle.yMin === fragment.location.yTop &&
            patch.rectangle.yMax === fragment.location.yBottom)

        if (patchNameMatches && patchRectangleMatches) {
          delete next[fragment.id]
        }
      }
      return next
    })
  }, [fragments])

  React.useEffect(() => {
    setMode(DEFAULT_MODE)
    setIsBrowseDialogOpen(false)
    setBrowseAreaId(null)
    setIsCreateAreaDialogOpen(false)
    setCreatingAreaDraft(null)
    setPendingCreatedAreas([])
    setOptimisticAreaPatches({})
    setOptimisticDeletedAreaIds([])
    setEditingAreaId(null)
    setNewAreaName('')
    setIsAreaDialogClosing(false)
  }, [document.id])

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
                    .sort((a, b) => a.orderNumber - b.orderNumber)
                    .map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.innerCode} — {a.name}
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
                void (async () => {
                  const pendingCreatedArea = pendingCreatedAreas.find(
                    (area) => area.tempId === areaId
                  )

                  if (pendingCreatedArea) {
                    setPendingCreatedAreas((prev) =>
                      prev.filter((area) => area.tempId !== areaId)
                    )
                    setMode((prevMode) =>
                      (prevMode.type === 'BROWSE_AREA' ||
                        prevMode.type === 'UPDATE_AREA_RECTANGLE') &&
                      prevMode.areaId === areaId
                        ? { type: 'DEFAULT' }
                        : prevMode
                    )
                    return
                  }

                  setOptimisticDeletedAreaIds((prev) =>
                    prev.includes(areaId) ? prev : [...prev, areaId]
                  )

                  try {
                    await serverConnector.deleteFragment({
                      id: areaId
                    })

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
                  } catch (error) {
                    setOptimisticDeletedAreaIds((prev) =>
                      prev.filter((id) => id !== areaId)
                    )
                    notifier.showError(
                      error,
                      `не удалось удалить фрагмент документа для документа «${document.code}»`
                    )
                  }
                })()
              }}
              onRenameAreaButtonClick={({ areaId }) => {
                openRenameAreaDialog(areaId)
              }}
              onCreateRectangle={({ rectangle, configFile }) => {
                openCreateAreaDialog(rectangle, configFile)
              }}
              onCreateRectangleCancel={() => setMode({ type: 'DEFAULT' })}
              onBrowseAreaCancel={() => setMode({ type: 'DEFAULT' })}
              onUpdateAreaRectangle={({ areaId, rectangle, configFile }) => {
                void (async () => {
                  const pendingCreatedArea = pendingCreatedAreas.find(
                    (area) => area.tempId === areaId
                  )

                  if (pendingCreatedArea) {
                    setPendingCreatedAreas((prev) =>
                      prev.map((area) =>
                        area.tempId === areaId
                          ? {
                              ...area,
                              rectangle,
                              configFile: configFile ?? area.configFile
                            }
                          : area
                      )
                    )
                    return
                  }

                  if (!configFile) {
                    notifier.showError(
                      `не удалось изменить фрагмент документа для документа «${document.code}»`
                    )
                    return
                  }

                  const previousRectangle = areas.find(
                    (area) => area.id === areaId
                  )?.rectangle

                  setOptimisticAreaPatches((prev) => ({
                    ...prev,
                    [areaId]: {
                      ...prev[areaId],
                      rectangle
                    }
                  }))

                  try {
                    await serverConnector.updateFragment(
                      {
                        id: areaId,
                        location: toFragmentLocation(rectangle)
                      },
                      configFile
                    )
                  } catch (error) {
                    setOptimisticAreaPatches((prev) => ({
                      ...prev,
                      [areaId]: {
                        ...prev[areaId],
                        rectangle: previousRectangle
                      }
                    }))
                    notifier.showError(
                      error,
                      `не удалось изменить фрагмент документа для документа «${document.code}»`
                    )
                  }
                })()
              }}
              onUpdateAreaRectangleCancel={() => setMode({ type: 'DEFAULT' })}
            />
          ) : null}
        </div>
      </Paper>
    </div>
  )
}
