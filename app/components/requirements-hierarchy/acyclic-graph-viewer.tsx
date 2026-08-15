// Project
import { ProjButton } from '../buttons/button'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { usePopupPreviewVisibilitySettings } from '~/hooks/popup-preview-visibility'
import { FormTextField } from '../forms/common'
import {
  useDocumentsFiltered,
  useFragmentsFiltered,
  useRequirement
} from '~/hooks/resources'
// React
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  type Viewport,
  useNodesInitialized,
  useOnViewportChange,
  useReactFlow,
  useStore
} from 'reactflow'
import 'reactflow/dist/style.css'
// Other
import AcyclicGraphVertexViewer, {
  type AcyclicGraphVertexViewerProps,
  type VertexData
} from './acyclic-graph-vertex-viewer'
import { edgeStyle } from './requirements'
import type { FragmentPrimary } from '~/types/resources/fragments'
import calculateNewNodePositions from './graph-layouts/layout-new'
import calculateFinalNodePositions from './graph-layouts/layout-final'
import { gray, green, orange, red } from '~/theme/themePrimitives'
import './styles.css'
// Material UI
import { alpha, styled, useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import Autocomplete from '@mui/material/Autocomplete'
import Checkbox from '@mui/material/Checkbox'
import Radio from '@mui/material/Radio'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import TuneIcon from '@mui/icons-material/Tune'
import { Link } from 'react-router'

const StackStyled = styled(Stack)(() => [
  {
    '&': {
      position: 'relative'
    }
  }
])

export interface Vertex {
  id: number
  childIds: number[]
  parentsIds: number[]
}

export interface AcyclicGraphViewerProps {
  vertexes: Vertex[]
  dataForVertexId: Map<number, VertexData>
  maxDisplayedLayerWhenWithoutSelected: number | null
  setMaxDisplayedLayerWhenWithoutSelected: React.Dispatch<
    React.SetStateAction<number | null>
  >
  /** default - false */
  fitOnSelectedIdChange?: boolean
  selectedId: number | null
  setSelectedId: React.Dispatch<React.SetStateAction<number | null>>
  onVertexClick?: (vertexId: number) => void
  onMiniVertexClick?: (vertexId: number) => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

type AcyclicGraphNode = Node<AcyclicGraphVertexViewerProps<VertexData>>
type MiniGraphDisplayMode = 'ROOT_PATH' | 'ALL_RELATED'
type ChildPanelKey = 'level2' | 'level3' | 'level4' | 'level5'
type CoverageDisplayKey = 'full' | 'must' | 'mustShould' | 'should' | 'may'
type HoveredVertexPreview = {
  id: number
  data: VertexData
  source: 'MAIN' | 'MINI'
  anchor: { left: number; top: number }
}

const COVERAGE_DISPLAY_OPTIONS: Array<{
  key: CoverageDisplayKey
  label: string
}> = [
  { key: 'full', label: 'Покрытие всех' },
  { key: 'must', label: 'Обязательные' },
  { key: 'mustShould', label: 'Обязательные и рекомендуемые' },
  { key: 'should', label: 'Рекомендуемые' },
  { key: 'may', label: 'Необязательные' }
]
const HOVER_PREVIEW_DELAY_MS = 640
const HOVER_PREVIEW_HIDE_DELAY_MS = 160

function parseCoverageFractionPercent(fraction: string): number | null {
  const [coveredRaw, totalRaw] = fraction.split('/').map((part) => part.trim())
  const covered = Number(coveredRaw)
  const total = Number(totalRaw)
  if (
    Number.isFinite(covered) === false ||
    Number.isFinite(total) === false ||
    total <= 0
  ) {
    return null
  }
  return (covered / total) * 100
}

function getCoverageFractionForVertex(
  vertexData: VertexData,
  coverageKey: CoverageDisplayKey
): string {
  switch (coverageKey) {
    case 'full':
      return vertexData.atomicityFlag
        ? `${vertexData.test !== '' ? '1' : '0'} / 1`
        : (vertexData.fullCoverageFraction ?? '0 / 0')
    case 'must':
      return vertexData.atomicityFlag
        ? `${vertexData.test !== '' && vertexData.modifier === 'MUST' ? '1' : '0'} / ${vertexData.modifier === 'MUST' ? '1' : '0'}`
        : (vertexData.onlyMustCoverageFraction ?? '0 / 0')
    case 'mustShould':
      return vertexData.atomicityFlag
        ? `${vertexData.test !== '' && vertexData.modifier !== 'MAY' ? '1' : '0'} / ${vertexData.modifier !== 'MAY' ? '1' : '0'}`
        : (vertexData.mustAndShouldCoverageFraction ?? '0 / 0')
    case 'should':
      return vertexData.atomicityFlag
        ? `${vertexData.test !== '' && vertexData.modifier === 'SHOULD' ? '1' : '0'} / ${vertexData.modifier === 'SHOULD' ? '1' : '0'}`
        : (vertexData.onlyShouldCoverageFraction ?? '0 / 0')
    case 'may':
      return vertexData.atomicityFlag
        ? `${vertexData.test !== '' && vertexData.modifier === 'MAY' ? '1' : '0'} / ${vertexData.modifier === 'MAY' ? '1' : '0'}`
        : (vertexData.onlyMayCoverageFraction ?? '0 / 0')
  }
}

const nodeTypes = {
  acyclicGraphVertex: AcyclicGraphVertexViewer
}

const MAIN_FLOW_INITIAL_ZOOM = 0.5
const MAIN_FLOW_MIN_ZOOM = MAIN_FLOW_INITIAL_ZOOM
const MAIN_FLOW_MAX_ZOOM = 2
const MAIN_FLOW_PINCH_ZOOM_SENSITIVITY_MULTIPLIER = 4
const MINI_GRAPH_ZOOM_SENSITIVITY_MULTIPLIER = 2.5
const MINI_GRAPH_FIT_VIEW_OPTIONS = {
  padding: 0.35,
  minZoom: 0.01,
  maxZoom: 1
} as const
const MINI_GRAPH_DEFAULT_WIDTH = 360
const MINI_GRAPH_MIN_WIDTH = 260
const MINI_GRAPH_MAX_WIDTH = 720
const MAIN_GRAPH_MIN_WIDTH_WHEN_RESIZING = 360
const MINI_GRAPH_RESIZE_STEP = 24

const isMacOs = () =>
  typeof navigator !== 'undefined' &&
  /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)

const getBaseZoomDeltaFromWheelEvent = (event: WheelEvent) => {
  const ctrlFactor = event.ctrlKey && isMacOs() ? 10 : 1
  const deltaFactor =
    event.deltaMode === 1 ? 0.05 : event.deltaMode !== 0 ? 1 : 0.002

  return -event.deltaY * deltaFactor * ctrlFactor
}

const FRAGMENT_SCREENSHOT_LOADER_DELAY_MS = 250

function HoverPreviewFragmentsBlock({
  requirementId,
  active,
  showFragments,
  previewKey,
  onReadyChange
}: {
  requirementId: number
  active: boolean
  showFragments: boolean
  previewKey: string
  onReadyChange: (previewKey: string, ready: boolean) => void
}) {
  const theme = useTheme()
  const notifier = useNotifier()
  const [selectedFragmentId, setSelectedFragmentId] = useState<number | null>(
    null
  )
  const [selectedFragmentScreenshotUrl, setSelectedFragmentScreenshotUrl] =
    useState<string | null>(null)
  const [isFragmentScreenshotLoading, setIsFragmentScreenshotLoading] =
    useState(false)
  const [showFragmentScreenshotLoader, setShowFragmentScreenshotLoader] =
    useState(false)
  const [fragmentScreenshotZoom, setFragmentScreenshotZoom] = useState(1)
  const screenshotRequestSeqRef = useRef(0)
  const fragmentScreenshotViewportRef = useRef<HTMLDivElement | null>(null)

  const requirement = useRequirement(
    'UP_TO_TERTIARY_PROPS',
    requirementId,
    false,
    active
  )
  const fragments = useFragmentsFiltered(
    'PRIMARY_PROPS',
    showFragments ? (requirement?.fragmentIds ?? null) : null,
    false,
    active && requirement !== null && showFragments
  )
  const fragmentForId = useMemo(
    () => new Map((fragments ?? []).map((fragment) => [fragment.id, fragment])),
    [fragments]
  )

  const documentIds = useMemo(
    () =>
      fragments !== null
        ? Array.from(new Set(fragments.map((fragment) => fragment.documentId)))
        : null,
    [fragments]
  )
  const documents = useDocumentsFiltered(
    'PRIMARY_PROPS',
    documentIds,
    false,
    active && documentIds !== null
  )
  const documentCodeForId = useMemo(
    () =>
      new Map(
        (documents ?? []).map((document) => [document.id, document.code])
      ),
    [documents]
  )

  const expectedFragmentIds = requirement?.fragmentIds ?? null
  const fragmentsMatchRequirement =
    expectedFragmentIds !== null &&
    fragments !== null &&
    (expectedFragmentIds.length === 0 ||
      expectedFragmentIds.every((fragmentId) => fragmentForId.has(fragmentId)))
  const documentsMatchFragments =
    documentIds !== null &&
    (documentIds.length === 0 ||
      documentIds.every((documentId) => documentCodeForId.has(documentId)))

  const selectedFragment =
    selectedFragmentId !== null
      ? (fragmentForId.get(selectedFragmentId) ?? null)
      : null

  const closeFragmentScreenshotDialog = useCallback(() => {
    screenshotRequestSeqRef.current += 1
    setSelectedFragmentId(null)
    setIsFragmentScreenshotLoading(false)
    setFragmentScreenshotZoom(1)
    setSelectedFragmentScreenshotUrl((oldUrl) => {
      if (oldUrl !== null) {
        URL.revokeObjectURL(oldUrl)
      }
      return null
    })
  }, [])

  useEffect(() => {
    if (!active) {
      closeFragmentScreenshotDialog()
    }
  }, [active, closeFragmentScreenshotDialog])

  useEffect(() => {
    if (!isFragmentScreenshotLoading) {
      setShowFragmentScreenshotLoader(false)
      return
    }
    const timer = setTimeout(() => {
      setShowFragmentScreenshotLoader(true)
    }, FRAGMENT_SCREENSHOT_LOADER_DELAY_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [isFragmentScreenshotLoading])

  useEffect(() => {
    return () => {
      if (selectedFragmentScreenshotUrl !== null) {
        URL.revokeObjectURL(selectedFragmentScreenshotUrl)
      }
    }
  }, [selectedFragmentScreenshotUrl])

  const handleFragmentClick = useCallback(
    (fragmentId: number) => {
      const fragment = fragmentForId.get(fragmentId)
      if (fragment === undefined) {
        return
      }

      screenshotRequestSeqRef.current += 1
      const requestSeq = screenshotRequestSeqRef.current

      setSelectedFragmentId(fragmentId)
      setIsFragmentScreenshotLoading(true)
      setFragmentScreenshotZoom(1)
      setSelectedFragmentScreenshotUrl((oldUrl) => {
        if (oldUrl !== null) {
          URL.revokeObjectURL(oldUrl)
        }
        return null
      })

      void (async () => {
        try {
          const blob = await serverConnector.readFragmentConfig({
            id: fragmentId
          })
          const screenshotUrl = URL.createObjectURL(blob)
          if (screenshotRequestSeqRef.current !== requestSeq) {
            URL.revokeObjectURL(screenshotUrl)
            return
          }

          setSelectedFragmentScreenshotUrl(screenshotUrl)
        } catch (error) {
          if (screenshotRequestSeqRef.current !== requestSeq) {
            return
          }
          notifier.showError(
            error,
            `не удалось загрузить скриншот фрагмента «${fragment.innerCode}»`
          )
        } finally {
          if (screenshotRequestSeqRef.current === requestSeq) {
            setIsFragmentScreenshotLoading(false)
          }
        }
      })()
    },
    [fragmentForId, notifier]
  )

  const zoomFragmentScreenshot = useCallback((deltaY: number) => {
    setFragmentScreenshotZoom((prevZoom) => {
      const nextZoom = prevZoom + (deltaY < 0 ? 0.06 : -0.06)
      return Math.min(4, Math.max(1, nextZoom))
    })
  }, [])

  const handleFragmentScreenshotWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      event.nativeEvent.stopImmediatePropagation()
      zoomFragmentScreenshot(event.deltaY)
    },
    [zoomFragmentScreenshot]
  )

  useEffect(() => {
    if (selectedFragmentId === null) {
      return
    }

    const handleNativeWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const viewport = fragmentScreenshotViewportRef.current
      const target = event.target
      if (
        viewport !== null &&
        target instanceof Node &&
        viewport.contains(target)
      ) {
        zoomFragmentScreenshot(event.deltaY)
      }
    }

    document.addEventListener('wheel', handleNativeWheel, {
      capture: true,
      passive: false
    })

    return () => {
      document.removeEventListener('wheel', handleNativeWheel, {
        capture: true
      })
    }
  }, [selectedFragmentId, zoomFragmentScreenshot])

  const isReady =
    showFragments === false ||
    (fragmentsMatchRequirement && documentsMatchFragments)

  useEffect(() => {
    onReadyChange(previewKey, isReady)
  }, [isReady, onReadyChange, previewKey])

  if (!isReady || (showFragments && fragments === null)) {
    return null
  }
  const visibleFragments: FragmentPrimary[] = fragments ?? []

  return (
    <Box sx={{ mt: 0.6 }}>
      <Divider sx={{ mb: 0.45 }} />
      <Stack
        direction="row"
        spacing={1}
        divider={<Divider orientation="vertical" flexItem />}
        sx={{ alignItems: 'stretch' }}
      >
        {showFragments ? (
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: theme.palette.text.secondary,
                fontSize: '10px',
                fontWeight: 700,
                mb: 0.35,
                textAlign: 'center'
              }}
            >
              фрагменты
            </Typography>
            <Stack
              direction="row"
              spacing={0.5}
              justifyContent="center"
              sx={{
                overflowX: 'auto',
                overflowY: 'hidden',
                flexWrap: 'nowrap',
                pb: 0.2,
                px: 0.1,
                '&::-webkit-scrollbar': {
                  height: 4
                },
                '&::-webkit-scrollbar-thumb': {
                  borderRadius: 999,
                  backgroundColor: alpha(theme.palette.primary.main, 0.45)
                }
              }}
            >
              {visibleFragments.length === 0 ? (
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.secondary, fontSize: '10px' }}
                >
                  нет
                </Typography>
              ) : (
                visibleFragments.map((fragment) => {
                  const documentCode =
                    documentCodeForId.get(fragment.documentId) ?? '???'
                  const label = `${documentCode} - ${fragment.innerCode}`
                  const isActive = selectedFragmentId === fragment.id

                  return (
                    <Chip
                      key={fragment.id}
                      label={label}
                      size="small"
                      variant={isActive ? 'filled' : 'outlined'}
                      clickable
                      onClick={() => handleFragmentClick(fragment.id)}
                      sx={{
                        maxWidth: 126,
                        flex: '0 0 auto',
                        borderColor: isActive
                          ? theme.palette.primary.main
                          : theme.palette.primary.dark,
                        backgroundColor: isActive
                          ? theme.palette.primary.main
                          : undefined,
                        color: isActive
                          ? theme.palette.primary.contrastText
                          : undefined,
                        ':hover': {
                          bgcolor: isActive
                            ? `${theme.palette.primary.dark} !important`
                            : theme.palette.mode === 'light'
                              ? 'rgb(239, 244, 251) !important'
                              : 'rgb(40, 47, 54) !important'
                        },
                        '& .MuiChip-label': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }
                      }}
                    />
                  )
                })
              )}
            </Stack>
          </Box>
        ) : null}
        <Box
          sx={{
            width: showFragments ? 112 : '100%',
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: 0.45
          }}
        >
          <Tooltip title="перейти к экрану выбранного требования">
            <Box
              component={Link}
              to={`/requirements/${requirementId}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textDecoration: 'none' }}
            >
              <ProjButton
                variant="contained"
                sx={{
                  minWidth: 0,
                  width: showFragments ? 'auto' : '100%',
                  px: 1.2
                }}
              >
                Подробнее
              </ProjButton>
            </Box>
          </Tooltip>
        </Box>
      </Stack>
      <Dialog
        open={selectedFragmentId !== null}
        onClose={() => undefined}
        onWheel={(event) => event.stopPropagation()}
        onWheelCapture={(event) => event.stopPropagation()}
        maxWidth="md"
        fullWidth
        sx={(theme) => ({
          zIndex: theme.zIndex.tooltip + 20
        })}
        PaperProps={{
          sx: (theme) => ({
            backgroundColor:
              theme.palette.mode === 'dark' ? gray[900] : gray[100],
            color: theme.palette.mode === 'dark' ? gray[100] : gray[700],
            borderRadius: 4
          })
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          Предпросмотр фрагмента
          {selectedFragment !== null ? `: ${selectedFragment.innerCode}` : ''}
        </DialogTitle>
        <DialogContent
          dividers
          onWheel={(event) => event.stopPropagation()}
          onWheelCapture={(event) => event.stopPropagation()}
        >
          <Box
            ref={fragmentScreenshotViewportRef}
            sx={{
              position: 'relative',
              minHeight: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto'
            }}
            onWheel={handleFragmentScreenshotWheel}
          >
            {selectedFragmentScreenshotUrl !== null ? (
              <Box
                component="img"
                src={selectedFragmentScreenshotUrl}
                alt={
                  selectedFragment !== null
                    ? `Предпросмотр фрагмента ${selectedFragment.innerCode}`
                    : 'Предпросмотр фрагмента'
                }
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: 1,
                  transform: 'scale(' + fragmentScreenshotZoom + ')',
                  transformOrigin: 'center center',
                  transition: 'transform 180ms ease-out'
                }}
              />
            ) : (
              <Typography textAlign="center" variant="body2">
                загрузка фрагмента...
              </Typography>
            )}
            {isFragmentScreenshotLoading && showFragmentScreenshotLoader ? (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.background.paper, 0.55)
                }}
              >
                <CircularProgress size={24} />
              </Box>
            ) : null}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 1 }}>
          {selectedFragment !== null ? (
            <Box
              component={Link}
              to={`/documents/${selectedFragment.documentId}?fragmentId=${selectedFragment.id}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textDecoration: 'none' }}
            >
              <ProjButton variant="contained">Подробнее</ProjButton>
            </Box>
          ) : null}
          <ProjButton onClick={closeFragmentScreenshotDialog}>
            Закрыть
          </ProjButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
function ReactFlowPinchZoomSensitivityController() {
  const d3Zoom = useStore((state) => state.d3Zoom)
  const d3Selection = useStore((state) => state.d3Selection)

  useEffect(() => {
    if (!d3Zoom || !d3Selection) {
      return
    }

    const pane = d3Selection.node() as HTMLElement | null

    if (pane === null) {
      return
    }

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey === false && event.metaKey === false) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const zoomValue: unknown = d3Selection.property('__zoom')

      const currentZoom =
        typeof zoomValue === 'object' &&
        zoomValue !== null &&
        'k' in zoomValue &&
        typeof zoomValue.k === 'number'
          ? zoomValue.k
          : 1

      const rect = pane.getBoundingClientRect()
      const point: [number, number] = [
        event.clientX - rect.left,
        event.clientY - rect.top
      ]
      const zoom =
        currentZoom *
        Math.pow(
          2,
          getBaseZoomDeltaFromWheelEvent(event) *
            MAIN_FLOW_PINCH_ZOOM_SENSITIVITY_MULTIPLIER
        )

      d3Zoom.scaleTo(d3Selection, zoom, point)
    }

    pane.addEventListener('wheel', handleWheel, {
      capture: true,
      passive: false
    })

    return () => {
      pane.removeEventListener('wheel', handleWheel, true)
    }
  }, [d3Zoom, d3Selection])

  return null
}

function MiniGraphWheelController() {
  const d3Zoom = useStore((state) => state.d3Zoom)
  const d3Selection = useStore((state) => state.d3Selection)

  useEffect(() => {
    if (!d3Zoom || !d3Selection) {
      return
    }

    const pane = d3Selection.node() as HTMLElement | null

    if (pane === null) {
      return
    }

    const handleWheel = (event: WheelEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('.nowheel') !== null
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const zoomValue: unknown = d3Selection.property('__zoom')

      const currentZoom =
        typeof zoomValue === 'object' &&
        zoomValue !== null &&
        'k' in zoomValue &&
        typeof zoomValue.k === 'number'
          ? zoomValue.k
          : 1

      const isPinchGesture = event.ctrlKey || event.metaKey
      const isLikelyMouseWheel =
        event.deltaMode === 1 ||
        (Math.abs(event.deltaY) >= 40 && Math.abs(event.deltaX) < 1)

      if (isPinchGesture || isLikelyMouseWheel) {
        const rect = pane.getBoundingClientRect()
        const point: [number, number] = [
          event.clientX - rect.left,
          event.clientY - rect.top
        ]
        const zoom =
          currentZoom *
          Math.pow(
            2,
            getBaseZoomDeltaFromWheelEvent(event) *
              MINI_GRAPH_ZOOM_SENSITIVITY_MULTIPLIER
          )

        d3Zoom.scaleTo(d3Selection, zoom, point)
        return
      }

      const deltaNormalize = event.deltaMode === 1 ? 20 : 1
      let deltaX = event.deltaX * deltaNormalize
      let deltaY = event.deltaY * deltaNormalize

      if (!isMacOs() && event.shiftKey) {
        deltaX = event.deltaY * deltaNormalize
        deltaY = 0
      }

      d3Zoom.translateBy(
        d3Selection,
        -(deltaX / currentZoom),
        -(deltaY / currentZoom)
      )
    }

    pane.addEventListener('wheel', handleWheel, {
      capture: true,
      passive: false
    })

    return () => {
      pane.removeEventListener('wheel', handleWheel, true)
    }
  }, [d3Zoom, d3Selection])

  return null
}

function MiniGraphAutoFit({
  fitKey,
  setReady
}: {
  fitKey: string
  setReady: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const reactFlow = useReactFlow()
  const nodesInitialized = useNodesInitialized()
  const viewportInitialized = useStore(
    (state) =>
      state.width > 0 &&
      state.height > 0 &&
      state.d3Zoom !== null &&
      state.d3Selection !== null
  )

  useLayoutEffect(() => {
    if (nodesInitialized === false || viewportInitialized === false) {
      return
    }

    setReady(false)
    let cancelled = false
    let frameId = 0

    const runFitView = () => {
      if (cancelled) {
        return
      }

      const fitted = reactFlow.fitView(MINI_GRAPH_FIT_VIEW_OPTIONS)

      if (fitted) {
        frameId = requestAnimationFrame(() => {
          if (cancelled === false) {
            setReady(true)
          }
        })
      } else {
        frameId = requestAnimationFrame(runFitView)
      }
    }

    frameId = requestAnimationFrame(runFitView)

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
    }
  }, [reactFlow, nodesInitialized, viewportInitialized, fitKey, setReady])

  return null
}

function MainGraphInitialTopViewport({ fitKey }: { fitKey: string }) {
  const reactFlow = useReactFlow()
  const nodesInitialized = useNodesInitialized()
  const viewportWidth = useStore((state) => state.width)
  const viewportInitialized = useStore(
    (state) =>
      state.width > 0 &&
      state.height > 0 &&
      state.d3Zoom !== null &&
      state.d3Selection !== null
  )

  useLayoutEffect(() => {
    if (nodesInitialized === false || viewportInitialized === false) {
      return
    }

    let cancelled = false
    const frameIds: number[] = []

    const alignTop = () => {
      if (cancelled) {
        return
      }

      const nodes = reactFlow.getNodes()
      if (nodes.length === 0) {
        return
      }

      const minX = Math.min(...nodes.map((node) => node.position.x))
      const maxX = Math.max(
        ...nodes.map((node) => node.position.x + (node.width ?? 150))
      )
      const minY = Math.min(...nodes.map((node) => node.position.y))
      const zoom = MAIN_FLOW_INITIAL_ZOOM
      void reactFlow.setViewport({
        x: viewportWidth / 2 - ((minX + maxX) / 2) * zoom,
        y: -minY * zoom,
        zoom
      })
    }

    const scheduleAlign = (framesLeft: number) => {
      const frameId = requestAnimationFrame(() => {
        alignTop()
        if (framesLeft > 0) {
          scheduleAlign(framesLeft - 1)
        }
      })
      frameIds.push(frameId)
    }

    scheduleAlign(8)

    return () => {
      cancelled = true
      frameIds.forEach((frameId) => cancelAnimationFrame(frameId))
    }
  }, [fitKey, reactFlow, nodesInitialized, viewportInitialized, viewportWidth])

  return null
}

function MainGraphViewportBounds({
  onViewportSettled
}: {
  onViewportSettled: () => void
}) {
  const reactFlow = useReactFlow()
  const nodesInitialized = useNodesInitialized()
  const viewportWidth = useStore((state) => state.width)
  const viewportHeight = useStore((state) => state.height)
  const isClampingRef = useRef(false)
  const settleFrameRef = useRef<number | null>(null)

  const getInitialViewport = useCallback((): Viewport | null => {
    if (
      nodesInitialized === false ||
      viewportWidth <= 0 ||
      viewportHeight <= 0
    ) {
      return null
    }

    const nodes = reactFlow.getNodes()
    if (nodes.length === 0) {
      return null
    }

    const minX = Math.min(...nodes.map((node) => node.position.x))
    const maxX = Math.max(
      ...nodes.map((node) => node.position.x + (node.width ?? 150))
    )
    const minY = Math.min(...nodes.map((node) => node.position.y))
    const zoom = MAIN_FLOW_INITIAL_ZOOM

    return {
      x: viewportWidth / 2 - ((minX + maxX) / 2) * zoom,
      y: -minY * zoom,
      zoom
    }
  }, [nodesInitialized, reactFlow, viewportHeight, viewportWidth])

  const clampViewport = useCallback(
    (viewport: Viewport): Viewport | null => {
      const initialViewport = getInitialViewport()
      if (initialViewport === null) {
        return null
      }

      const zoom = Math.max(viewport.zoom, MAIN_FLOW_INITIAL_ZOOM)
      const initialLeft = -initialViewport.x / MAIN_FLOW_INITIAL_ZOOM
      const initialRight =
        (viewportWidth - initialViewport.x) / MAIN_FLOW_INITIAL_ZOOM
      const initialTop = -initialViewport.y / MAIN_FLOW_INITIAL_ZOOM
      const initialBottom =
        (viewportHeight - initialViewport.y) / MAIN_FLOW_INITIAL_ZOOM

      const minX = viewportWidth - initialRight * zoom
      const maxX = -initialLeft * zoom
      const minY = viewportHeight - initialBottom * zoom
      const maxY = -initialTop * zoom

      return {
        x: Math.min(maxX, Math.max(minX, viewport.x)),
        y: Math.min(maxY, Math.max(minY, viewport.y)),
        zoom
      }
    },
    [getInitialViewport, viewportHeight, viewportWidth]
  )

  const scheduleViewportSettled = useCallback(() => {
    if (settleFrameRef.current !== null) {
      cancelAnimationFrame(settleFrameRef.current)
    }

    settleFrameRef.current = requestAnimationFrame(() => {
      settleFrameRef.current = null
      onViewportSettled()
    })
  }, [onViewportSettled])

  useEffect(() => {
    return () => {
      if (settleFrameRef.current !== null) {
        cancelAnimationFrame(settleFrameRef.current)
      }
    }
  }, [])

  const handleViewportChange = useCallback(
    (viewport: Viewport) => {
      if (isClampingRef.current) {
        isClampingRef.current = false
        scheduleViewportSettled()
        return
      }

      const clampedViewport = clampViewport(viewport)
      if (clampedViewport === null) {
        return
      }

      const changed =
        Math.abs(clampedViewport.x - viewport.x) > 0.5 ||
        Math.abs(clampedViewport.y - viewport.y) > 0.5 ||
        Math.abs(clampedViewport.zoom - viewport.zoom) > 0.001

      if (changed) {
        isClampingRef.current = true
        void reactFlow.setViewport(clampedViewport, { duration: 0 })
        scheduleViewportSettled()
      } else {
        scheduleViewportSettled()
      }
    },
    [clampViewport, reactFlow, scheduleViewportSettled]
  )

  useOnViewportChange({ onChange: handleViewportChange })

  return null
}
function MainGraphAutoFitOnRequest({ fitRequest }: { fitRequest: number }) {
  const reactFlow = useReactFlow()
  const nodesInitialized = useNodesInitialized()
  const viewportInitialized = useStore(
    (state) =>
      state.width > 0 &&
      state.height > 0 &&
      state.d3Zoom !== null &&
      state.d3Selection !== null
  )

  useLayoutEffect(() => {
    if (
      fitRequest === 0 ||
      nodesInitialized === false ||
      !viewportInitialized
    ) {
      return
    }

    let cancelled = false
    let firstFrameId = 0
    let secondFrameId = 0

    firstFrameId = requestAnimationFrame(() => {
      secondFrameId = requestAnimationFrame(() => {
        if (cancelled === false) {
          reactFlow.fitView()
        }
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(firstFrameId)
      cancelAnimationFrame(secondFrameId)
    }
  }, [fitRequest, reactFlow, nodesInitialized, viewportInitialized])

  return null
}

function MainGraphFocusOnNodeRequest({
  focusRequest,
  nodeId
}: {
  focusRequest: number
  nodeId: string | null
}) {
  const reactFlow = useReactFlow()
  const nodesInitialized = useNodesInitialized()
  const viewportInitialized = useStore(
    (state) =>
      state.width > 0 &&
      state.height > 0 &&
      state.d3Zoom !== null &&
      state.d3Selection !== null
  )

  useLayoutEffect(() => {
    if (
      focusRequest === 0 ||
      nodeId === null ||
      nodesInitialized === false ||
      viewportInitialized === false
    ) {
      return
    }

    let cancelled = false
    let frameId = 0

    const runFocus = () => {
      if (cancelled) {
        return
      }

      const node = reactFlow.getNode(nodeId)
      if (node === undefined) {
        frameId = requestAnimationFrame(runFocus)
        return
      }

      const position = node.positionAbsolute ?? node.position
      const width = node.width ?? 200
      const height = node.height ?? 60

      reactFlow.setCenter(position.x + width / 2, position.y + height / 2, {
        zoom: 0.5,
        duration: 300
      })
    }

    frameId = requestAnimationFrame(runFocus)

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
    }
  }, [focusRequest, nodeId, reactFlow, nodesInitialized, viewportInitialized])

  return null
}

const getVertexLevel = (vertexData: VertexData): number => {
  const v = vertexData as unknown
  if (typeof v === 'object' && v !== null && 'level' in v) {
    const level = (v as Record<string, unknown>).level
    if (typeof level === 'number' && Number.isFinite(level)) return level
  }
  return 1
}

const getCommonPrefix = (values: string[]): string => {
  if (values.length < 2) {
    return ''
  }

  let prefix = values[0] ?? ''

  values.slice(1).forEach((value) => {
    while (prefix !== '' && value.startsWith(prefix) === false) {
      prefix = prefix.slice(0, -1)
    }
  })

  return prefix
}

type DisplayCodeInfo = {
  displayCode: string
  commonPrefix: string
}

const getDisplayCodeInfoByVertexId = (
  vertexes: Vertex[],
  dataForVertexId: Map<number, VertexData>
): Map<number, DisplayCodeInfo> => {
  const codes = vertexes
    .map((vertex) => dataForVertexId.get(vertex.id)?.code ?? '')
    .filter((code) => code !== '')
  const commonPrefix = getCommonPrefix(codes)

  if (commonPrefix === '') {
    return new Map()
  }

  return new Map(
    vertexes.map((vertex) => {
      const code = dataForVertexId.get(vertex.id)?.code ?? ''
      const displayCode = code.startsWith(commonPrefix)
        ? code.slice(commonPrefix.length)
        : code

      return [
        vertex.id,
        {
          displayCode: displayCode === '' ? code : displayCode,
          commonPrefix
        }
      ]
    })
  )
}

const useContainerSize = (
  defaultWidth: number = 1920,
  defaultHeight: number = 1080
) => {
  const [size, setSize] = useState({
    width: defaultWidth,
    height: defaultHeight
  })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setSize({
          width: Math.max(width - 40, 800),
          height: Math.max(height - 40, 400)
        })
      }
    }

    const resizeObserver = new ResizeObserver(updateSize)

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
      updateSize()
    }

    window.addEventListener('resize', updateSize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  return { containerRef, ...size }
}

const getMiniGraphNodeIds = (
  selectedId: number | null,
  vertexes: Vertex[],
  displayMode: MiniGraphDisplayMode
): number[] => {
  if (selectedId === null) {
    return []
  }

  const vertexById = new Map(vertexes.map((vertex) => [vertex.id, vertex]))
  const includedIds = new Set<number>()

  const addParents = (id: number) => {
    const vertex = vertexById.get(id)
    if (vertex === undefined) {
      return
    }

    includedIds.add(id)
    vertex.parentsIds.forEach((parentId) => addParents(parentId))
  }

  const addChildren = (id: number) => {
    const vertex = vertexById.get(id)
    if (vertex === undefined) {
      return
    }

    includedIds.add(id)
    vertex.childIds.forEach((childId) => addChildren(childId))
  }

  addParents(selectedId)

  if (displayMode === 'ALL_RELATED') {
    addChildren(selectedId)
  }

  return Array.from(includedIds)
}

const getMiniFlowData = (
  selectedId: number | null,
  vertexes: Vertex[],
  dataForVertexId: Map<number, VertexData>,
  displayMode: MiniGraphDisplayMode,
  coverageDisplayKey: CoverageDisplayKey
): {
  nodes: AcyclicGraphNode[]
  edges: Edge[]
} => {
  if (selectedId === null) {
    return { nodes: [], edges: [] }
  }

  const includedIds = new Set(
    getMiniGraphNodeIds(selectedId, vertexes, displayMode)
  )
  const includedVertexes = vertexes.filter((vertex) =>
    includedIds.has(vertex.id)
  )
  const vertexById = new Map(
    includedVertexes.map((vertex) => [vertex.id, vertex])
  )
  const byLevel = new Map<number, Vertex[]>()

  includedVertexes.forEach((vertex) => {
    const vertexData = dataForVertexId.get(vertex.id)
    if (vertexData === undefined) {
      return
    }

    const level = getVertexLevel(vertexData)
    byLevel.set(level, [...(byLevel.get(level) ?? []), vertex])
  })

  const levels = Array.from(byLevel.keys()).sort((a, b) => a - b)
  const nodeWidth = 220
  const nodeSpacing = 30
  const levelHeight = 110
  const nodes: AcyclicGraphNode[] = []

  levels.forEach((level, levelIndex) => {
    const levelVertexes = (byLevel.get(level) ?? []).sort((a, b) => a.id - b.id)
    const displayCodeInfoByVertexId = getDisplayCodeInfoByVertexId(
      levelVertexes,
      dataForVertexId
    )
    const levelWidth =
      levelVertexes.length * nodeWidth +
      Math.max(0, levelVertexes.length - 1) * nodeSpacing
    const startX = -levelWidth / 2

    levelVertexes.forEach((vertex, index) => {
      const vertexData = dataForVertexId.get(vertex.id)
      if (vertexData === undefined) {
        return
      }

      nodes.push({
        id: vertex.id.toString(),
        type: 'acyclicGraphVertex',
        position: {
          x: startX + index * (nodeWidth + nodeSpacing) + nodeWidth / 2,
          y: levelIndex * levelHeight + 40
        },
        data: {
          id: vertex.id,
          level,
          hasParents: vertex.parentsIds.some((parentId) =>
            includedIds.has(parentId)
          ),
          hasChildren: vertex.childIds.some((childId) =>
            includedIds.has(childId)
          ),
          data: vertexData,
          displayCode: displayCodeInfoByVertexId.get(vertex.id)?.displayCode,
          commonPrefix: displayCodeInfoByVertexId.get(vertex.id)?.commonPrefix,
          coverageFraction: getCoverageFractionForVertex(
            vertexData,
            coverageDisplayKey
          ),
          type: vertex.id === selectedId ? 'SELECTED' : 'RELATED',
          dimmed: false,
          collapsed: false
        },
        draggable: false,
        selectable: false
      })
    })
  })

  const edges = includedVertexes.flatMap((vertex) =>
    vertex.childIds
      .filter((childId) => vertexById.has(childId))
      .map((childId) => ({
        id: `mini-${vertex.id}-${childId}`,
        source: vertex.id.toString(),
        target: childId.toString(),
        type: 'default',
        animated: false,
        ...edgeStyle
      }))
  )

  return { nodes, edges }
}

const getDirectChildVertexes = (
  selectedId: number | null,
  vertexes: Vertex[],
  dataForVertexId: Map<number, VertexData>
): { childLevel: number; childVertexes: Vertex[] } => {
  if (selectedId === null) {
    return { childLevel: 1, childVertexes: [] }
  }

  const selectedVertex = vertexes.find((vertex) => vertex.id === selectedId)
  const selectedData = dataForVertexId.get(selectedId)

  if (selectedVertex === undefined || selectedData === undefined) {
    return { childLevel: 1, childVertexes: [] }
  }

  const childLevel = getVertexLevel(selectedData) + 1
  const childVertexes = selectedVertex.childIds
    .map((childId) => vertexes.find((vertex) => vertex.id === childId))
    .filter((vertex): vertex is Vertex => vertex !== undefined)
    .filter((vertex) => {
      const vertexData = dataForVertexId.get(vertex.id)

      return (
        vertexData !== undefined && getVertexLevel(vertexData) === childLevel
      )
    })
    .sort((a, b) => a.id - b.id)

  return { childLevel, childVertexes }
}

export default function AcyclicGraphViewer({
  vertexes,
  dataForVertexId,
  fitOnSelectedIdChange = false,
  selectedId,
  setSelectedId,
  onVertexClick,
  onMiniVertexClick,
  isFullscreen = false,
  onToggleFullscreen
}: AcyclicGraphViewerProps) {
  void fitOnSelectedIdChange

  const {
    containerRef,
    width: containerWidth,
    height: containerHeight
  } = useContainerSize()
  const theme = useTheme()
  const mainGraphHostRef = useRef<HTMLDivElement | null>(null)
  const [miniGraphWidth, setMiniGraphWidth] = useState(MINI_GRAPH_DEFAULT_WIDTH)

  const [baseNodes, setBaseNodes] = useState<AcyclicGraphNode[]>([])
  const [baseEdges, setBaseEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [miniGraphReady, setMiniGraphReady] = useState(false)
  const [miniGraphDisplayMode, setMiniGraphDisplayMode] =
    useState<MiniGraphDisplayMode>('ALL_RELATED')
  const [isMiniGraphEnabled] = useState(false)
  const [expandedLevel1Id, setExpandedLevel1Id] = useState<number | null>(null)
  const [expandedLevel2Id, setExpandedLevel2Id] = useState<number | null>(null)
  const [expandedLevel3Id, setExpandedLevel3Id] = useState<number | null>(null)
  const [expandedLevel4Id, setExpandedLevel4Id] = useState<number | null>(null)
  const [rootPanelAnchor, setRootPanelAnchor] = useState({
    left: 0,
    top: 12
  })
  const [rootPanelReady, setRootPanelReady] = useState(false)
  const [childPanelAnchor, setChildPanelAnchor] = useState({
    left: 12,
    top: 12
  })
  const [grandChildPanelAnchor, setGrandChildPanelAnchor] = useState({
    left: 12,
    top: 104
  })
  const [greatGrandChildPanelAnchor, setGreatGrandChildPanelAnchor] = useState({
    left: 12,
    top: 196
  })
  const [level5PanelAnchor, setLevel5PanelAnchor] = useState({
    left: 12,
    top: 288
  })
  const [childPanelReady, setChildPanelReady] = useState(false)
  const [grandChildPanelReady, setGrandChildPanelReady] = useState(false)
  const [greatGrandChildPanelReady, setGreatGrandChildPanelReady] =
    useState(false)
  const [level5PanelReady, setLevel5PanelReady] = useState(false)
  const [rootScrollStartIndex, setRootScrollStartIndex] = useState(0)
  const [childScrollStartIndex, setChildScrollStartIndex] = useState(0)
  const [grandChildScrollStartIndex, setGrandChildScrollStartIndex] =
    useState(0)
  const [greatGrandChildScrollStartIndex, setGreatGrandChildScrollStartIndex] =
    useState(0)
  const [level5ScrollStartIndex, setLevel5ScrollStartIndex] = useState(0)
  const [hiddenChildVertexIdsByPanel, setHiddenChildVertexIdsByPanel] =
    useState<Record<ChildPanelKey, number[]>>({
      level2: [],
      level3: [],
      level4: [],
      level5: []
    })
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<HTMLElement | null>(
    null
  )
  const [filterMenuPanelKey, setFilterMenuPanelKey] =
    useState<ChildPanelKey | null>(null)
  const [filterMenuSearch, setFilterMenuSearch] = useState('')
  const [coverageSettingsMenuAnchor, setCoverageSettingsMenuAnchor] =
    useState<HTMLElement | null>(null)
  const [selectedProgressDisplayKey, setSelectedProgressDisplayKey] =
    useState<CoverageDisplayKey>('full')
  const [visibleCoverageDisplayKeys, setVisibleCoverageDisplayKeys] = useState<
    CoverageDisplayKey[]
  >(COVERAGE_DISPLAY_OPTIONS.map((option) => option.key))
  const [showFragmentsInHoverPreview, setShowFragmentsInHoverPreview] =
    useState(true)
  const [hoveredVertexPreview, setHoveredVertexPreview] =
    useState<HoveredVertexPreview | null>(null)
  const [readyHoverPreviewKey, setReadyHoverPreviewKey] = useState<
    string | null
  >(null)
  const {
    settings: popupPreviewVisibilitySettings,
    setSetting: setPopupPreviewVisibilitySetting
  } = usePopupPreviewVisibilitySettings()
  const hoverPreviewIsEnabled =
    popupPreviewVisibilitySettings.requirementDetails &&
    popupPreviewVisibilitySettings.requirement
  const effectiveShowFragmentsInHoverPreview =
    hoverPreviewIsEnabled && showFragmentsInHoverPreview

  const [isFullGraphVisible, setIsFullGraphVisible] = useState(false)
  const [fullGraphMaxLevel, setFullGraphMaxLevel] = useState(2)

  const fullGraphAvailableMaxLevel = useMemo(
    () =>
      vertexes.reduce((maxLevel, vertex) => {
        const vertexData = dataForVertexId.get(vertex.id)
        return vertexData === undefined
          ? maxLevel
          : Math.max(maxLevel, getVertexLevel(vertexData))
      }, 2),
    [vertexes, dataForVertexId]
  )
  const fullGraphIsExpanded = fullGraphMaxLevel >= fullGraphAvailableMaxLevel

  const selectedCoverageDisplayKey = useMemo(
    () =>
      COVERAGE_DISPLAY_OPTIONS.find((option) =>
        visibleCoverageDisplayKeys.includes(option.key)
      )?.key ?? 'full',
    [visibleCoverageDisplayKeys]
  )
  const convertToNodes = useCallback((): AcyclicGraphNode[] => {
    const nodes: AcyclicGraphNode[] = []

    if (isFullGraphVisible) {
      vertexes.forEach((vertex) => {
        const vertexData = dataForVertexId.get(vertex.id)
        if (
          vertexData === undefined ||
          getVertexLevel(vertexData) > fullGraphMaxLevel
        ) {
          return
        }

        nodes.push({
          id: vertex.id.toString(),
          type: 'acyclicGraphVertex',
          position: { x: 0, y: 0 },
          data: {
            id: vertex.id,
            level: getVertexLevel(vertexData),
            hasParents: vertex.parentsIds.length > 0,
            hasChildren: vertex.childIds.length > 0,
            data: vertexData,
            coverageFraction: getCoverageFractionForVertex(
              vertexData,
              selectedProgressDisplayKey
            ),
            type: selectedId === vertex.id ? 'SELECTED' : 'DEFAULT',
            dimmed: false,
            collapsed: false
          }
        })
      })

      return nodes
    }

    const allLevel1Vertexes = vertexes
      .filter((vertex) => {
        const vertexData = dataForVertexId.get(vertex.id)
        return vertexData !== undefined && getVertexLevel(vertexData) === 1
      })
      .sort((a, b) => a.id - b.id)
    const level1Vertexes = allLevel1Vertexes.slice(
      rootScrollStartIndex,
      rootScrollStartIndex + 12
    )
    const displayCodeInfoByVertexId = getDisplayCodeInfoByVertexId(
      level1Vertexes,
      dataForVertexId
    )

    level1Vertexes.forEach((vertex) => {
      const vertexData = dataForVertexId.get(vertex.id)
      if (vertexData === undefined || getVertexLevel(vertexData) !== 1) {
        return
      }

      nodes.push({
        id: vertex.id.toString(),
        type: 'acyclicGraphVertex',
        position: { x: 0, y: 0 },
        data: {
          id: vertex.id,
          level: 1,
          hasParents: false,
          hasChildren: vertex.childIds.length > 0,
          data: vertexData,
          displayCode: displayCodeInfoByVertexId.get(vertex.id)?.displayCode,
          commonPrefix: displayCodeInfoByVertexId.get(vertex.id)?.commonPrefix,
          coverageFraction: getCoverageFractionForVertex(
            vertexData,
            selectedProgressDisplayKey
          ),
          type: selectedId === vertex.id ? 'SELECTED' : 'DEFAULT',
          dimmed: false,
          collapsed: false
        }
      })
    })

    return nodes
  }, [
    isFullGraphVisible,
    fullGraphMaxLevel,
    vertexes,
    dataForVertexId,
    selectedId,
    selectedProgressDisplayKey,
    rootScrollStartIndex
  ])

  const convertToEdges = useCallback((): Edge[] => {
    if (isFullGraphVisible === false) {
      return []
    }

    const visibleVertexIds = new Set(
      vertexes
        .filter((vertex) => {
          const vertexData = dataForVertexId.get(vertex.id)
          return (
            vertexData !== undefined &&
            getVertexLevel(vertexData) <= fullGraphMaxLevel
          )
        })
        .map((vertex) => vertex.id)
    )

    return vertexes.flatMap((vertex) => {
      if (visibleVertexIds.has(vertex.id) === false) {
        return []
      }

      return vertex.childIds
        .filter((childId) => visibleVertexIds.has(childId))
        .map((childId) => ({
          id: vertex.id.toString() + '-' + childId.toString(),
          source: vertex.id.toString(),
          target: childId.toString(),
          type: 'default',
          animated: false,
          ...edgeStyle
        }))
    })
  }, [isFullGraphVisible, fullGraphMaxLevel, vertexes, dataForVertexId])

  const [mainGraphFitRequest, setMainGraphFitRequest] = useState(0)
  const [mainGraphFocusRequest, setMainGraphFocusRequest] = useState(0)
  const isFullscreenInitializedRef = useRef(false)
  const isMiniGraphToggleInitializedRef = useRef(false)
  const hoverPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const hoverPreviewHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  useEffect(() => {
    if (hoverPreviewIsEnabled) {
      return
    }

    if (hoverPreviewTimerRef.current !== null) {
      clearTimeout(hoverPreviewTimerRef.current)
      hoverPreviewTimerRef.current = null
    }
    if (hoverPreviewHideTimerRef.current !== null) {
      clearTimeout(hoverPreviewHideTimerRef.current)
      hoverPreviewHideTimerRef.current = null
    }
    setHoveredVertexPreview(null)
    setReadyHoverPreviewKey(null)
  }, [hoverPreviewIsEnabled])

  const hoveredVertexPreviewKey =
    hoveredVertexPreview !== null
      ? hoveredVertexPreview.source + ':' + hoveredVertexPreview.id
      : null
  const hoverPreviewIsReady =
    hoveredVertexPreviewKey !== null &&
    (effectiveShowFragmentsInHoverPreview === false ||
      readyHoverPreviewKey === hoveredVertexPreviewKey)

  const level1Count = useMemo(
    () =>
      vertexes.filter((vertex) => {
        const vertexData = dataForVertexId.get(vertex.id)
        return vertexData !== undefined && getVertexLevel(vertexData) === 1
      }).length,
    [vertexes, dataForVertexId]
  )

  useEffect(() => {
    setRootScrollStartIndex((prev) =>
      Math.min(prev, Math.max(0, level1Count - 12))
    )
  }, [level1Count])
  const level2ChildVertexes = useMemo(
    () =>
      getDirectChildVertexes(expandedLevel1Id, vertexes, dataForVertexId)
        .childVertexes,
    [expandedLevel1Id, vertexes, dataForVertexId]
  )
  const level3ChildVertexes = useMemo(
    () =>
      getDirectChildVertexes(expandedLevel2Id, vertexes, dataForVertexId)
        .childVertexes,
    [expandedLevel2Id, vertexes, dataForVertexId]
  )
  const level4ChildVertexes = useMemo(
    () =>
      getDirectChildVertexes(expandedLevel3Id, vertexes, dataForVertexId)
        .childVertexes,
    [expandedLevel3Id, vertexes, dataForVertexId]
  )
  const level5ChildVertexes = useMemo(
    () =>
      getDirectChildVertexes(expandedLevel4Id, vertexes, dataForVertexId)
        .childVertexes,
    [expandedLevel4Id, vertexes, dataForVertexId]
  )
  const selectedChildCount = level2ChildVertexes.filter(
    (vertex) => !hiddenChildVertexIdsByPanel.level2.includes(vertex.id)
  ).length
  const selectedGrandChildCount = level3ChildVertexes.filter(
    (vertex) => !hiddenChildVertexIdsByPanel.level3.includes(vertex.id)
  ).length
  const selectedGreatGrandChildCount = level4ChildVertexes.filter(
    (vertex) => !hiddenChildVertexIdsByPanel.level4.includes(vertex.id)
  ).length
  const selectedLevel5Count = level5ChildVertexes.filter(
    (vertex) => !hiddenChildVertexIdsByPanel.level5.includes(vertex.id)
  ).length
  useLayoutEffect(() => {
    if (containerWidth > 0 && containerHeight > 0) {
      const nodes = convertToNodes()
      const edges = convertToEdges()

      const layoutedNodes = (
        isFullGraphVisible
          ? calculateFinalNodePositions
          : calculateNewNodePositions
      )(nodes, vertexes, containerWidth, containerHeight)

      setBaseNodes(layoutedNodes)
      setBaseEdges(edges)
      setLoading(false)
    }
  }, [
    containerWidth,
    containerHeight,
    convertToNodes,
    convertToEdges,
    vertexes,
    isFullGraphVisible,
    setBaseNodes,
    setBaseEdges
  ])

  const createChildGraphData = useCallback(
    (
      parentId: number | null,
      parentNodes: AcyclicGraphNode[],
      scrollStartIndex: number,
      panelId: string,
      hiddenVertexIds: number[]
    ) => {
      const selectedLayoutedNode =
        parentId !== null
          ? parentNodes.find((node) => node.id === parentId.toString())
          : undefined
      const { childLevel, childVertexes: allChildVertexes } =
        getDirectChildVertexes(parentId, vertexes, dataForVertexId)
      const childVertexes = allChildVertexes.filter(
        (vertex) => !hiddenVertexIds.includes(vertex.id)
      )
      const visibleChildLimit = 12
      const safeChildStartIndex = Math.min(
        scrollStartIndex,
        Math.max(0, childVertexes.length - visibleChildLimit)
      )
      const displayedChildVertexes = childVertexes.slice(
        safeChildStartIndex,
        safeChildStartIndex + visibleChildLimit
      )
      const nodeWidth = 150
      const nodeSpacing = 16
      const slotStep = nodeWidth + nodeSpacing
      const graphCenterX =
        baseNodes.length === 0
          ? 0
          : (Math.min(...baseNodes.map((node) => node.position.x)) +
              Math.max(
                ...baseNodes.map((node) => node.position.x + nodeWidth)
              )) /
            2
      const parentCenterX =
        (selectedLayoutedNode?.position.x ?? graphCenterX) + nodeWidth / 2
      const fullSlotsStartX =
        graphCenterX - ((visibleChildLimit - 1) * slotStep) / 2 - nodeWidth / 2
      const parentSlotIndex = Math.min(
        visibleChildLimit - 1,
        Math.max(
          0,
          Math.round(
            (parentCenterX - fullSlotsStartX - nodeWidth / 2) / slotStep
          )
        )
      )
      const compactSlotIndexes = Array.from(
        { length: visibleChildLimit },
        (_value, index) => index
      ).sort(
        (a, b) => Math.abs(a - parentSlotIndex) - Math.abs(b - parentSlotIndex)
      )
      const childY = (selectedLayoutedNode?.position.y ?? 0) + 136
      const displayCodeInfoByVertexId = getDisplayCodeInfoByVertexId(
        displayedChildVertexes,
        dataForVertexId
      )
      const nodes: AcyclicGraphNode[] =
        selectedLayoutedNode === undefined
          ? []
          : displayedChildVertexes.flatMap((vertex, index) => {
              const vertexData = dataForVertexId.get(vertex.id)
              if (vertexData === undefined) {
                return []
              }

              return [
                {
                  id: vertex.id.toString(),
                  type: 'acyclicGraphVertex',
                  position: {
                    x:
                      fullSlotsStartX +
                      (childVertexes.length > visibleChildLimit
                        ? index
                        : (compactSlotIndexes[index] ?? parentSlotIndex)) *
                        slotStep,
                    y: childY
                  },
                  data: {
                    id: vertex.id,
                    level: childLevel,
                    hasParents: true,
                    hasChildren: vertex.childIds.length > 0,
                    data: vertexData,
                    displayCode: displayCodeInfoByVertexId.get(vertex.id)
                      ?.displayCode,
                    commonPrefix: displayCodeInfoByVertexId.get(vertex.id)
                      ?.commonPrefix,
                    coverageFraction: getCoverageFractionForVertex(
                      vertexData,
                      selectedProgressDisplayKey
                    ),
                    type: selectedId === vertex.id ? 'SELECTED' : 'RELATED',
                    dimmed: false,
                    collapsed: false
                  },
                  draggable: false,
                  selectable: false
                }
              ]
            })
      const edges: Edge[] =
        selectedLayoutedNode === undefined
          ? []
          : displayedChildVertexes.map((vertex) => ({
              id: `${panelId}-${parentId}-${vertex.id}`,
              source: parentId?.toString() ?? '',
              target: vertex.id.toString(),
              type: 'default',
              animated: false,
              ...edgeStyle
            }))

      return { nodes, edges }
    },
    [
      baseNodes,
      vertexes,
      dataForVertexId,
      selectedId,
      selectedProgressDisplayKey
    ]
  )

  const childGraphData = useMemo(
    () =>
      createChildGraphData(
        expandedLevel1Id,
        baseNodes,
        childScrollStartIndex,
        'child-panel',
        hiddenChildVertexIdsByPanel.level2
      ),
    [
      createChildGraphData,
      expandedLevel1Id,
      baseNodes,
      childScrollStartIndex,
      hiddenChildVertexIdsByPanel.level2
    ]
  )
  const grandChildGraphData = useMemo(
    () =>
      createChildGraphData(
        expandedLevel2Id,
        childGraphData.nodes,
        grandChildScrollStartIndex,
        'grand-child-panel',
        hiddenChildVertexIdsByPanel.level3
      ),
    [
      createChildGraphData,
      expandedLevel2Id,
      childGraphData.nodes,
      grandChildScrollStartIndex,
      hiddenChildVertexIdsByPanel.level3
    ]
  )

  const greatGrandChildGraphData = useMemo(
    () =>
      createChildGraphData(
        expandedLevel3Id,
        grandChildGraphData.nodes,
        greatGrandChildScrollStartIndex,
        'great-grand-child-panel',
        hiddenChildVertexIdsByPanel.level4
      ),
    [
      createChildGraphData,
      expandedLevel3Id,
      grandChildGraphData.nodes,
      greatGrandChildScrollStartIndex,
      hiddenChildVertexIdsByPanel.level4
    ]
  )

  const level5GraphData = useMemo(
    () =>
      createChildGraphData(
        expandedLevel4Id,
        greatGrandChildGraphData.nodes,
        level5ScrollStartIndex,
        'level-5-panel',
        hiddenChildVertexIdsByPanel.level5
      ),
    [
      createChildGraphData,
      expandedLevel4Id,
      greatGrandChildGraphData.nodes,
      level5ScrollStartIndex,
      hiddenChildVertexIdsByPanel.level5
    ]
  )

  const allNodes = useMemo(
    () =>
      isFullGraphVisible
        ? baseNodes
        : [
            ...baseNodes,
            ...childGraphData.nodes,
            ...grandChildGraphData.nodes,
            ...greatGrandChildGraphData.nodes,
            ...level5GraphData.nodes
          ],
    [
      isFullGraphVisible,
      baseNodes,
      childGraphData.nodes,
      grandChildGraphData.nodes,
      greatGrandChildGraphData.nodes,
      level5GraphData.nodes
    ]
  )
  const allEdges = useMemo(
    () =>
      isFullGraphVisible
        ? baseEdges
        : [
            ...baseEdges,
            ...childGraphData.edges,
            ...grandChildGraphData.edges,
            ...greatGrandChildGraphData.edges,
            ...level5GraphData.edges
          ],
    [
      isFullGraphVisible,
      baseEdges,
      childGraphData.edges,
      grandChildGraphData.edges,
      greatGrandChildGraphData.edges,
      level5GraphData.edges
    ]
  )
  const mainGraphInitialFitKey = useMemo(
    () =>
      baseNodes
        .map((node) => `${node.id}:${node.position.x}:${node.position.y}`)
        .join('|'),
    [baseNodes]
  )

  const miniFlowData = useMemo(
    () =>
      getMiniFlowData(
        selectedId,
        vertexes,
        dataForVertexId,
        miniGraphDisplayMode,
        selectedProgressDisplayKey
      ),
    [
      selectedId,
      vertexes,
      dataForVertexId,
      miniGraphDisplayMode,
      selectedProgressDisplayKey
    ]
  )
  const childFlowIsVisible =
    isFullGraphVisible === false &&
    expandedLevel1Id !== null &&
    level2ChildVertexes.length > 0
  const grandChildFlowIsVisible =
    isFullGraphVisible === false &&
    expandedLevel2Id !== null &&
    level3ChildVertexes.length > 0
  const greatGrandChildFlowIsVisible =
    isFullGraphVisible === false &&
    expandedLevel3Id !== null &&
    level4ChildVertexes.length > 0
  const level5FlowIsVisible =
    isFullGraphVisible === false &&
    expandedLevel4Id !== null &&
    level5ChildVertexes.length > 0
  const updatePanelAnchor = useCallback(
    (
      nodeId: number | null,
      rowNodes: AcyclicGraphNode[],
      setAnchor: React.Dispatch<
        React.SetStateAction<{ left: number; top: number }>
      >,
      setReady: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
      if (mainGraphHostRef.current === null) {
        return
      }

      const hostRect = mainGraphHostRef.current.getBoundingClientRect()
      const rowNodeBottoms = rowNodes
        .map((node) =>
          mainGraphHostRef.current?.querySelector<HTMLElement>(
            `.react-flow__node[data-id="${node.id}"]`
          )
        )
        .filter(
          (node): node is HTMLElement => node !== null && node !== undefined
        )
        .map((node) => node.getBoundingClientRect().bottom - hostRect.top)

      if (rowNodeBottoms.length > 0) {
        setAnchor({
          left: 0,
          top: Math.max(12, Math.max(...rowNodeBottoms) - 62)
        })
        setReady(true)
        return
      }

      if (nodeId === null) {
        return
      }

      const nodeElement = mainGraphHostRef.current.querySelector<HTMLElement>(
        `.react-flow__node[data-id="${nodeId}"]`
      )

      if (nodeElement === null) {
        return
      }

      const nodeRect = nodeElement.getBoundingClientRect()
      setAnchor({
        left: 0,
        top: Math.max(12, nodeRect.bottom - hostRect.top + 8)
      })
      setReady(true)
    },
    []
  )
  const updateRootPanelAnchor = useCallback(() => {
    if (mainGraphHostRef.current === null || baseNodes.length === 0) {
      return
    }

    const hostRect = mainGraphHostRef.current.getBoundingClientRect()
    const rootNodeBottoms = baseNodes
      .filter((node) => node.data.level === 1)
      .map((node) =>
        mainGraphHostRef.current?.querySelector<HTMLElement>(
          `.react-flow__node[data-id="${node.id}"]`
        )
      )
      .filter(
        (node): node is HTMLElement => node !== null && node !== undefined
      )
      .map((node) => node.getBoundingClientRect().bottom - hostRect.top)

    if (rootNodeBottoms.length === 0) {
      return
    }

    setRootPanelAnchor({
      left: 0,
      top: Math.max(...rootNodeBottoms) - 62
    })
    setRootPanelReady(true)
  }, [baseNodes])
  const updateChildPanelAnchor = useCallback(() => {
    updateRootPanelAnchor()
    updatePanelAnchor(
      expandedLevel1Id,
      childGraphData.nodes,
      setChildPanelAnchor,
      setChildPanelReady
    )
    updatePanelAnchor(
      expandedLevel2Id,
      grandChildGraphData.nodes,
      setGrandChildPanelAnchor,
      setGrandChildPanelReady
    )
    updatePanelAnchor(
      expandedLevel3Id,
      greatGrandChildGraphData.nodes,
      setGreatGrandChildPanelAnchor,
      setGreatGrandChildPanelReady
    )
    updatePanelAnchor(
      expandedLevel4Id,
      level5GraphData.nodes,
      setLevel5PanelAnchor,
      setLevel5PanelReady
    )
  }, [
    childGraphData.nodes,
    expandedLevel1Id,
    expandedLevel2Id,
    expandedLevel3Id,
    expandedLevel4Id,
    grandChildGraphData.nodes,
    greatGrandChildGraphData.nodes,
    level5GraphData.nodes,
    updatePanelAnchor,
    updateRootPanelAnchor
  ])
  const getPanelFilterVertexes = useCallback(
    (panelKey: ChildPanelKey): Vertex[] => {
      switch (panelKey) {
        case 'level2':
          return level2ChildVertexes
        case 'level3':
          return level3ChildVertexes
        case 'level4':
          return level4ChildVertexes
        case 'level5':
          return level5ChildVertexes
      }
    },
    [
      level2ChildVertexes,
      level3ChildVertexes,
      level4ChildVertexes,
      level5ChildVertexes
    ]
  )

  const handleOpenPanelFilterMenu = useCallback(
    (panelKey: ChildPanelKey, event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation()
      setFilterMenuPanelKey(panelKey)
      setFilterMenuSearch('')
      setFilterMenuAnchor(event.currentTarget)
    },
    []
  )

  const handleClosePanelFilterMenu = useCallback(() => {
    setFilterMenuAnchor(null)
    setFilterMenuPanelKey(null)
    setFilterMenuSearch('')
  }, [])

  const handleTogglePanelFilterVertex = useCallback(
    (panelKey: ChildPanelKey, vertexId: number) => {
      setHiddenChildVertexIdsByPanel((prev) => {
        const hiddenIds = prev[panelKey]
        const isHidden = hiddenIds.includes(vertexId)

        if (isHidden) {
          return {
            ...prev,
            [panelKey]: hiddenIds.filter((id) => id !== vertexId)
          }
        }

        return {
          ...prev,
          [panelKey]: [...hiddenIds, vertexId]
        }
      })
    },
    []
  )

  const handleToggleAllPanelFilterVertexes = useCallback(
    (panelKey: ChildPanelKey, targetVertexIds?: number[]) => {
      setHiddenChildVertexIdsByPanel((prev) => {
        const allVertexIds =
          targetVertexIds ??
          getPanelFilterVertexes(panelKey).map((vertex) => vertex.id)
        const allHidden = allVertexIds.every((id) =>
          prev[panelKey].includes(id)
        )

        return {
          ...prev,
          [panelKey]: allHidden
            ? prev[panelKey].filter((id) => !allVertexIds.includes(id))
            : Array.from(new Set([...prev[panelKey], ...allVertexIds]))
        }
      })
    },
    [getPanelFilterVertexes]
  )
  const handleRootPanelWheel = useCallback(
    (event: React.WheelEvent) => {
      if (level1Count <= 12 || expandedLevel1Id !== null) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      const direction = event.deltaY + event.deltaX > 0 ? 1 : -1
      setRootScrollStartIndex((prev) =>
        Math.min(Math.max(prev + direction, 0), level1Count - 12)
      )
    },
    [expandedLevel1Id, level1Count]
  )
  const handleChildPanelWheel = useCallback(
    (event: React.WheelEvent) => {
      if (selectedChildCount <= 12 || expandedLevel2Id !== null) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      const direction = event.deltaY + event.deltaX > 0 ? 1 : -1
      setChildScrollStartIndex((prev) =>
        Math.min(Math.max(prev + direction, 0), selectedChildCount - 12)
      )
    },
    [expandedLevel2Id, selectedChildCount]
  )
  const handleGrandChildPanelWheel = useCallback(
    (event: React.WheelEvent) => {
      if (selectedGrandChildCount <= 12) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      setExpandedLevel3Id(null)
      const direction = event.deltaY + event.deltaX > 0 ? 1 : -1
      setGrandChildScrollStartIndex((prev) =>
        Math.min(Math.max(prev + direction, 0), selectedGrandChildCount - 12)
      )
    },
    [selectedGrandChildCount]
  )
  const handleGreatGrandChildPanelWheel = useCallback(
    (event: React.WheelEvent) => {
      if (selectedGreatGrandChildCount <= 12) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      setExpandedLevel4Id(null)
      const direction = event.deltaY + event.deltaX > 0 ? 1 : -1
      setGreatGrandChildScrollStartIndex((prev) =>
        Math.min(
          Math.max(prev + direction, 0),
          selectedGreatGrandChildCount - 12
        )
      )
    },
    [selectedGreatGrandChildCount]
  )
  const handleLevel5PanelWheel = useCallback(
    (event: React.WheelEvent) => {
      if (selectedLevel5Count <= 12) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      const direction = event.deltaY + event.deltaX > 0 ? 1 : -1
      setLevel5ScrollStartIndex((prev) =>
        Math.min(Math.max(prev + direction, 0), selectedLevel5Count - 12)
      )
    },
    [selectedLevel5Count]
  )

  const handleMainGraphHostWheelCapture = useCallback(
    (event: React.WheelEvent) => {
      if (mainGraphHostRef.current === null) {
        return
      }

      const hostRect = mainGraphHostRef.current.getBoundingClientRect()
      const pointerY = event.clientY - hostRect.top

      if (
        rootPanelReady &&
        pointerY >= rootPanelAnchor.top &&
        pointerY <= rootPanelAnchor.top + 80
      ) {
        handleRootPanelWheel(event)
        return
      }

      if (
        level5FlowIsVisible &&
        pointerY >= level5PanelAnchor.top &&
        pointerY <= level5PanelAnchor.top + 80
      ) {
        handleLevel5PanelWheel(event)
        return
      }

      if (
        greatGrandChildFlowIsVisible &&
        pointerY >= greatGrandChildPanelAnchor.top &&
        pointerY <= greatGrandChildPanelAnchor.top + 80
      ) {
        handleGreatGrandChildPanelWheel(event)
        return
      }

      if (
        grandChildFlowIsVisible &&
        pointerY >= grandChildPanelAnchor.top &&
        pointerY <= grandChildPanelAnchor.top + 80
      ) {
        handleGrandChildPanelWheel(event)
        return
      }

      if (
        childFlowIsVisible &&
        pointerY >= childPanelAnchor.top &&
        pointerY <= childPanelAnchor.top + 80
      ) {
        handleChildPanelWheel(event)
      }
    },
    [
      childFlowIsVisible,
      grandChildFlowIsVisible,
      greatGrandChildFlowIsVisible,
      level5FlowIsVisible,
      rootPanelReady,
      rootPanelAnchor.top,
      childPanelAnchor.top,
      grandChildPanelAnchor.top,
      greatGrandChildPanelAnchor.top,
      level5PanelAnchor.top,
      handleRootPanelWheel,
      handleChildPanelWheel,
      handleGrandChildPanelWheel,
      handleGreatGrandChildPanelWheel,
      handleLevel5PanelWheel
    ]
  )
  const miniGraphFitKey = useMemo(
    () =>
      [
        selectedId ?? 'none',
        miniGraphDisplayMode,
        miniFlowData.nodes.map((node) => node.id).join(','),
        miniFlowData.edges.map((edge) => edge.id).join(',')
      ].join('|'),
    [selectedId, miniGraphDisplayMode, miniFlowData.nodes, miniFlowData.edges]
  )

  useEffect(() => {
    setMiniGraphReady(false)
  }, [miniGraphFitKey])

  useEffect(() => {
    setChildPanelReady(false)
    setChildScrollStartIndex(0)
    setExpandedLevel2Id(null)
    setExpandedLevel3Id(null)
    setExpandedLevel4Id(null)
    setGrandChildPanelReady(false)
    setGrandChildScrollStartIndex(0)
    setGreatGrandChildPanelReady(false)
    setGreatGrandChildScrollStartIndex(0)
    setLevel5PanelReady(false)
    setLevel5ScrollStartIndex(0)
    setHiddenChildVertexIdsByPanel((prev) => ({
      ...prev,
      level2: [],
      level3: [],
      level4: [],
      level5: []
    }))
  }, [expandedLevel1Id])

  useEffect(() => {
    setGrandChildPanelReady(false)
    setGrandChildScrollStartIndex(0)
    setExpandedLevel3Id(null)
    setGreatGrandChildPanelReady(false)
    setGreatGrandChildScrollStartIndex(0)
    setLevel5PanelReady(false)
    setLevel5ScrollStartIndex(0)
    setHiddenChildVertexIdsByPanel((prev) => ({
      ...prev,
      level3: [],
      level4: [],
      level5: []
    }))
  }, [expandedLevel2Id])

  useEffect(() => {
    setGreatGrandChildPanelReady(false)
    setGreatGrandChildScrollStartIndex(0)
    setExpandedLevel4Id(null)
    setLevel5PanelReady(false)
    setLevel5ScrollStartIndex(0)
    setHiddenChildVertexIdsByPanel((prev) => ({
      ...prev,
      level4: [],
      level5: []
    }))
  }, [expandedLevel3Id])

  useEffect(() => {
    setLevel5PanelReady(false)
    setLevel5ScrollStartIndex(0)
    setHiddenChildVertexIdsByPanel((prev) => ({
      ...prev,
      level5: []
    }))
  }, [expandedLevel4Id])

  useLayoutEffect(() => {
    if (
      childFlowIsVisible === false &&
      grandChildFlowIsVisible === false &&
      greatGrandChildFlowIsVisible === false &&
      level5FlowIsVisible === false
    ) {
      setChildPanelReady(false)
      setGrandChildPanelReady(false)
      setGreatGrandChildPanelReady(false)
      setLevel5PanelReady(false)
      return undefined
    }

    let cancelled = false
    const frameId = requestAnimationFrame(() => {
      if (cancelled === false) {
        updateChildPanelAnchor()
      }
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
    }
  }, [
    updateChildPanelAnchor,
    expandedLevel1Id,
    expandedLevel2Id,
    expandedLevel3Id,
    expandedLevel4Id,
    childFlowIsVisible,
    grandChildFlowIsVisible,
    greatGrandChildFlowIsVisible,
    level5FlowIsVisible
  ])
  useEffect(() => {
    if (isFullscreenInitializedRef.current === false) {
      isFullscreenInitializedRef.current = true
      return
    }

    setMainGraphFitRequest((prev) => prev + 1)
  }, [isFullscreen])

  useEffect(() => {
    if (isMiniGraphToggleInitializedRef.current === false) {
      isMiniGraphToggleInitializedRef.current = true
      return
    }

    if (selectedId !== null) {
      setMainGraphFitRequest((prev) => prev + 1)
    }
  }, [isMiniGraphEnabled])

  const requirementSearchOptions = useMemo(
    () =>
      vertexes
        .map((vertex) => {
          const vertexData = dataForVertexId.get(vertex.id)
          return vertexData === undefined
            ? null
            : {
                id: vertex.id,
                title: vertexData.code,
                level: getVertexLevel(vertexData)
              }
        })
        .filter(
          (option): option is { id: number; title: string; level: number } => {
            return option !== null
          }
        )
        .sort((a, b) => a.title.localeCompare(b.title)),
    [vertexes, dataForVertexId]
  )

  const selectedRequirementSearchOption = useMemo(
    () =>
      selectedId === null
        ? null
        : (requirementSearchOptions.find(
            (option) => option.id === selectedId
          ) ?? null),
    [selectedId, requirementSearchOptions]
  )

  const selectVertex = useCallback(
    (
      vertexId: number,
      options?: { focus?: boolean; ensureVisible?: boolean }
    ) => {
      const nodeId = vertexId.toString()

      onVertexClick?.(vertexId)
      setSelectedId(vertexId)
      setSelectedNodeId(nodeId)
      setSelectedEdgeId(null)

      if (options?.focus === true) {
        setMainGraphFocusRequest((prev) => prev + 1)
      }
    },
    [onVertexClick, setSelectedId]
  )

  const handleNodeClick = useCallback(
    (
      _event: React.MouseEvent,
      node: Node<AcyclicGraphVertexViewerProps<VertexData>>
    ) => {
      if (node.data.data.atomicityFlag) {
        return
      }

      const nodeId = node.id
      const vertexId = parseInt(nodeId, 10)
      const level = node.data.level

      if (isFullGraphVisible) {
        selectVertex(vertexId)
        return
      }

      if (selectedId === vertexId) {
        onVertexClick?.(vertexId)
        setSelectedEdgeId(null)

        if (level === 1) {
          setSelectedId(null)
          setSelectedNodeId(null)
          setExpandedLevel1Id(null)
          setExpandedLevel2Id(null)
          setExpandedLevel3Id(null)
          setExpandedLevel4Id(null)
        } else if (level === 2) {
          setExpandedLevel2Id(null)
          setExpandedLevel3Id(null)
          setExpandedLevel4Id(null)
          if (expandedLevel1Id !== null) {
            setSelectedId(expandedLevel1Id)
            setSelectedNodeId(expandedLevel1Id.toString())
          } else {
            setSelectedId(null)
            setSelectedNodeId(null)
          }
        } else if (level === 3) {
          setExpandedLevel3Id(null)
          setExpandedLevel4Id(null)
          if (expandedLevel2Id !== null) {
            setSelectedId(expandedLevel2Id)
            setSelectedNodeId(expandedLevel2Id.toString())
          } else {
            setSelectedId(null)
            setSelectedNodeId(null)
          }
        } else if (level === 4) {
          setExpandedLevel4Id(null)
          if (expandedLevel3Id !== null) {
            setSelectedId(expandedLevel3Id)
            setSelectedNodeId(expandedLevel3Id.toString())
          } else {
            setSelectedId(null)
            setSelectedNodeId(null)
          }
        } else if (level === 5) {
          if (expandedLevel4Id !== null) {
            setSelectedId(expandedLevel4Id)
            setSelectedNodeId(expandedLevel4Id.toString())
          } else {
            setSelectedId(null)
            setSelectedNodeId(null)
          }
        } else {
          setSelectedId(null)
          setSelectedNodeId(null)
        }
        return
      }

      if (level === 1) {
        setExpandedLevel1Id(vertexId)
        setExpandedLevel2Id(null)
        setExpandedLevel3Id(null)
        setExpandedLevel4Id(null)
      } else if (level === 2) {
        setExpandedLevel2Id(vertexId)
        setExpandedLevel3Id(null)
        setExpandedLevel4Id(null)
      } else if (level === 3) {
        setExpandedLevel3Id(vertexId)
        setExpandedLevel4Id(null)
      } else if (level === 4) {
        setExpandedLevel4Id(vertexId)
      }

      selectVertex(vertexId)
    },
    [
      expandedLevel1Id,
      expandedLevel2Id,
      expandedLevel3Id,
      expandedLevel4Id,
      isFullGraphVisible,
      onVertexClick,
      selectedId,
      selectVertex,
      setSelectedId
    ]
  )
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation()
    setSelectedEdgeId((prev) => (prev === edge.id ? null : edge.id))
  }, [])

  const scheduleHoverPreview = useCallback(
    (
      event: React.MouseEvent,
      node: Node<AcyclicGraphVertexViewerProps<VertexData>>,
      source: HoveredVertexPreview['source']
    ) => {
      if (hoverPreviewIsEnabled === false) {
        return
      }

      if (hoverPreviewHideTimerRef.current !== null) {
        clearTimeout(hoverPreviewHideTimerRef.current)
        hoverPreviewHideTimerRef.current = null
      }

      if (hoverPreviewTimerRef.current !== null) {
        clearTimeout(hoverPreviewTimerRef.current)
      }

      const nodeElement =
        event.currentTarget instanceof HTMLElement
          ? (event.currentTarget.closest<HTMLElement>('.react-flow__node') ??
            event.currentTarget)
          : null
      const nodeRect = nodeElement?.getBoundingClientRect()
      const previewWidth = effectiveShowFragmentsInHoverPreview
        ? Math.min(Math.max(280, window.innerWidth * 0.34), 330)
        : Math.min(Math.max(180, window.innerWidth * 0.24), 230)
      const viewportPadding = 8
      const anchor =
        nodeRect !== undefined
          ? {
              left: Math.min(
                Math.max(
                  nodeRect.left + nodeRect.width / 2 - previewWidth / 2,
                  viewportPadding
                ),
                window.innerWidth - previewWidth - viewportPadding
              ),
              top: nodeRect.top
            }
          : {
              left: Math.min(
                Math.max(event.clientX - previewWidth / 2, viewportPadding),
                window.innerWidth - previewWidth - viewportPadding
              ),
              top: event.clientY
            }

      const previewData: HoveredVertexPreview = {
        id: node.data.id,
        data: node.data.data,
        source,
        anchor
      }

      hoverPreviewTimerRef.current = setTimeout(() => {
        setReadyHoverPreviewKey(null)
        setHoveredVertexPreview(previewData)
        hoverPreviewTimerRef.current = null
      }, HOVER_PREVIEW_DELAY_MS)
    },
    [effectiveShowFragmentsInHoverPreview, hoverPreviewIsEnabled]
  )

  const handleNodeMouseEnter = useCallback(
    (
      event: React.MouseEvent,
      node: Node<AcyclicGraphVertexViewerProps<VertexData>>
    ) => {
      scheduleHoverPreview(event, node, 'MAIN')
    },
    [scheduleHoverPreview]
  )

  const handleMiniNodeMouseEnter = useCallback(
    (
      event: React.MouseEvent,
      node: Node<AcyclicGraphVertexViewerProps<VertexData>>
    ) => {
      scheduleHoverPreview(event, node, 'MINI')
    },
    [scheduleHoverPreview]
  )

  const handleNodeMouseLeave = useCallback(() => {
    if (hoverPreviewTimerRef.current !== null) {
      clearTimeout(hoverPreviewTimerRef.current)
      hoverPreviewTimerRef.current = null
    }

    if (hoverPreviewHideTimerRef.current !== null) {
      clearTimeout(hoverPreviewHideTimerRef.current)
    }

    hoverPreviewHideTimerRef.current = setTimeout(() => {
      setHoveredVertexPreview(null)
      setReadyHoverPreviewKey(null)
      hoverPreviewHideTimerRef.current = null
    }, HOVER_PREVIEW_HIDE_DELAY_MS)
  }, [])

  const handleMiniNodeClick = useCallback(
    (
      event: React.MouseEvent,
      node: Node<AcyclicGraphVertexViewerProps<VertexData>>
    ) => {
      event.stopPropagation()

      if (node.data.data.atomicityFlag) {
        return
      }

      onMiniVertexClick?.(node.data.id)
    },
    [onMiniVertexClick]
  )

  useEffect(() => {
    return () => {
      if (hoverPreviewTimerRef.current !== null) {
        clearTimeout(hoverPreviewTimerRef.current)
      }
      if (hoverPreviewHideTimerRef.current !== null) {
        clearTimeout(hoverPreviewHideTimerRef.current)
      }
    }
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setSelectedId(null)
    setExpandedLevel1Id(null)
    setExpandedLevel2Id(null)
    setExpandedLevel3Id(null)
    setExpandedLevel4Id(null)
  }, [setSelectedId])

  const handlePaneClick = useCallback(() => {
    resetSelection()
  }, [resetSelection])

  const handleRequirementSearchChange = useCallback(
    (
      _event: React.SyntheticEvent,
      value: { id: number; title: string; level: number } | null
    ) => {
      if (value === null) {
        resetSelection()
        return
      }

      if (value.level === 1) {
        setExpandedLevel1Id(value.id)
        setExpandedLevel2Id(null)
        setExpandedLevel3Id(null)
        setExpandedLevel4Id(null)
      } else if (value.level === 2) {
        const parent = vertexes.find((vertex) =>
          vertex.childIds.includes(value.id)
        )
        setExpandedLevel1Id(parent?.id ?? null)
        setExpandedLevel2Id(value.id)
        setExpandedLevel3Id(null)
        setExpandedLevel4Id(null)
      } else if (value.level === 3) {
        const parent2 = vertexes.find((vertex) =>
          vertex.childIds.includes(value.id)
        )
        const parent1 = vertexes.find(
          (vertex) =>
            parent2 !== undefined && vertex.childIds.includes(parent2.id)
        )
        setExpandedLevel1Id(parent1?.id ?? null)
        setExpandedLevel2Id(parent2?.id ?? null)
        setExpandedLevel3Id(value.id)
        setExpandedLevel4Id(null)
      } else if (value.level === 4) {
        const parent3 = vertexes.find((vertex) =>
          vertex.childIds.includes(value.id)
        )
        const parent2 = vertexes.find(
          (vertex) =>
            parent3 !== undefined && vertex.childIds.includes(parent3.id)
        )
        const parent1 = vertexes.find(
          (vertex) =>
            parent2 !== undefined && vertex.childIds.includes(parent2.id)
        )
        setExpandedLevel1Id(parent1?.id ?? null)
        setExpandedLevel2Id(parent2?.id ?? null)
        setExpandedLevel3Id(parent3?.id ?? null)
        setExpandedLevel4Id(value.id)
      }

      selectVertex(value.id, { ensureVisible: true, focus: true })
    },
    [resetSelection, selectVertex, vertexes]
  )

  const handleOpenCoverageSettingsMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation()
      setCoverageSettingsMenuAnchor((prevAnchor) =>
        prevAnchor === null ? event.currentTarget : null
      )
    },
    []
  )

  const handleCloseCoverageSettingsMenu = useCallback(() => {
    setCoverageSettingsMenuAnchor(null)
  }, [])

  const handleSelectProgressDisplayKey = useCallback(
    (key: CoverageDisplayKey) => {
      setSelectedProgressDisplayKey(key)
    },
    []
  )

  const handleToggleShowHoverPreview = useCallback(() => {
    const nextValue = !popupPreviewVisibilitySettings.requirementDetails
    setPopupPreviewVisibilitySetting('requirementDetails', nextValue)
    if (nextValue === false) {
      setShowFragmentsInHoverPreview(false)
      handleNodeMouseLeave()
    }
  }, [
    handleNodeMouseLeave,
    popupPreviewVisibilitySettings.requirementDetails,
    setPopupPreviewVisibilitySetting
  ])

  const handleToggleShowFragmentsInHoverPreview = useCallback(() => {
    if (popupPreviewVisibilitySettings.requirementDetails === false) {
      return
    }

    setShowFragmentsInHoverPreview((prevValue) => !prevValue)
  }, [popupPreviewVisibilitySettings.requirementDetails])

  const handleToggleCoverageDisplayKey = useCallback(
    (key: CoverageDisplayKey) => {
      setVisibleCoverageDisplayKeys((prevKeys) => {
        if (prevKeys.includes(key)) {
          if (prevKeys.length === 1) {
            return prevKeys
          }
          return prevKeys.filter((prevKey) => prevKey !== key)
        }

        return [...prevKeys, key]
      })
    },
    []
  )

  const getCoverageRowsForVertex = useCallback(
    (vertexData: VertexData): string[][] => {
      const rowsByKey: Record<CoverageDisplayKey, string[]> = {
        full: [
          'Покрытие всех',
          vertexData.atomicityFlag
            ? `${vertexData.test !== '' ? '1' : '0'} / 1`
            : (vertexData.fullCoverageFraction ?? '0 / 0')
        ],
        must: [
          'Обязательные',
          vertexData.atomicityFlag
            ? `${vertexData.test !== '' && vertexData.modifier === 'MUST' ? '1' : '0'} / ${vertexData.modifier === 'MUST' ? '1' : '0'}`
            : (vertexData.onlyMustCoverageFraction ?? '0 / 0')
        ],
        mustShould: [
          'Обязательные и рекомендуемые',
          vertexData.atomicityFlag
            ? `${vertexData.test !== '' && vertexData.modifier !== 'MAY' ? '1' : '0'} / ${vertexData.modifier !== 'MAY' ? '1' : '0'}`
            : (vertexData.mustAndShouldCoverageFraction ?? '0 / 0')
        ],
        should: [
          'Рекомендуемые',
          vertexData.atomicityFlag
            ? `${vertexData.test !== '' && vertexData.modifier === 'SHOULD' ? '1' : '0'} / ${vertexData.modifier === 'SHOULD' ? '1' : '0'}`
            : (vertexData.onlyShouldCoverageFraction ?? '0 / 0')
        ],
        may: [
          'Необязательные',
          vertexData.atomicityFlag
            ? `${vertexData.test !== '' && vertexData.modifier === 'MAY' ? '1' : '0'} / ${vertexData.modifier === 'MAY' ? '1' : '0'}`
            : (vertexData.onlyMayCoverageFraction ?? '0 / 0')
        ]
      }

      return [
        ...COVERAGE_DISPLAY_OPTIONS.filter((option) =>
          visibleCoverageDisplayKeys.includes(option.key)
        ).map((option) => rowsByKey[option.key]),
        ...(vertexData.atomicityFlag ? [['Тест', vertexData.test || '—']] : [])
      ]
    },
    [visibleCoverageDisplayKeys]
  )
  const renderLevelPrefixBadge = (
    nodes: AcyclicGraphNode[],
    top: number = 8
  ) => {
    const commonPrefix = nodes.find(
      (node) => node.data.commonPrefix !== undefined
    )?.data.commonPrefix

    if (commonPrefix === undefined || commonPrefix === '') {
      return null
    }

    return (
      <Tooltip
        title="Общий префикс требований уровня"
        placement="top-start"
        arrow
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.common.white, 0.96)
                  : alpha(theme.palette.common.black, 0.96),
              color:
                theme.palette.mode === 'dark'
                  ? theme.palette.common.black
                  : theme.palette.common.white,
              fontSize: '11px',
              fontWeight: 500,
              px: 1,
              py: 0.5,
              maxWidth: 220
            }
          },
          arrow: {
            sx: {
              color:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.common.white, 0.96)
                  : alpha(theme.palette.common.black, 0.96)
            }
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: 8,
            top,
            zIndex: 15,
            maxWidth: 'min(420px, 44vw)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            border: '1px solid',
            borderColor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.32)
                : alpha(theme.palette.common.black, 0.22),
            borderRadius: 1,
            px: 0.75,
            py: 0.25,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.black, 0.78)
                : alpha(theme.palette.common.white, 0.92),
            color: theme.palette.text.primary,
            boxShadow:
              theme.palette.mode === 'dark'
                ? `0 2px 10px ${alpha(theme.palette.common.black, 0.45)}`
                : `0 2px 10px ${alpha(theme.palette.common.black, 0.16)}`,
            fontSize: '11px',
            fontWeight: 600,
            lineHeight: 1.35,
            pointerEvents: 'auto'
          }}
        >
          {commonPrefix}…
        </Box>
      </Tooltip>
    )
  }
  const renderPanelControls = ({
    panelKey,
    panelTop,
    visibleCount,
    scrollStartIndex,
    setScrollStartIndex,
    beforeScrollChange,
    disabled,
    hideFilterButton
  }: {
    panelKey: ChildPanelKey
    panelTop: number
    visibleCount: number
    scrollStartIndex: number
    setScrollStartIndex: React.Dispatch<React.SetStateAction<number>>
    beforeScrollChange?: () => void
    disabled?: boolean
    hideFilterButton?: boolean
  }) => {
    const maxScrollStartIndex = Math.max(0, visibleCount - 12)

    return (
      <>
        {visibleCount > 12 ? (
          <>
            <Box
              component="button"
              type="button"
              title="В начало уровня"
              aria-label="В начало уровня"
              disabled={disabled}
              onClick={() => {
                if (disabled === true) {
                  return
                }
                beforeScrollChange?.()
                setScrollStartIndex(0)
              }}
              sx={{
                position: 'absolute',
                left: 18,
                top: panelTop + 62,
                zIndex: 16,
                width: 16,
                height: 16,
                p: 0,
                border: `1px solid ${theme.palette.primary.main}`,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
                boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.28)}`,
                cursor: disabled === true ? 'default' : 'pointer',
                opacity: disabled === true ? 0.45 : 1,
                pointerEvents: 'auto',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-60%, -50%)',
                  borderTop: '4px solid transparent',
                  borderBottom: '4px solid transparent',
                  borderRight: `4px solid ${theme.palette.primary.contrastText}`
                },
                '&:hover':
                  disabled === true
                    ? undefined
                    : {
                        borderColor: theme.palette.primary.light,
                        backgroundColor: theme.palette.primary.light
                      }
              }}
            />
            <Box
              component="input"
              type="range"
              min={0}
              max={maxScrollStartIndex}
              value={Math.min(scrollStartIndex, maxScrollStartIndex)}
              disabled={disabled}
              onChange={(event) => {
                if (disabled === true) {
                  return
                }
                beforeScrollChange?.()
                setScrollStartIndex(Number(event.target.value))
              }}
              sx={{
                position: 'absolute',
                left: 44,
                right: 82,
                top: panelTop + 62,
                zIndex: 16,
                pointerEvents: 'auto',
                accentColor: theme.palette.primary.main
              }}
            />
            <Box
              component="button"
              type="button"
              title="В конец уровня"
              aria-label="В конец уровня"
              disabled={disabled}
              onClick={() => {
                if (disabled === true) {
                  return
                }
                beforeScrollChange?.()
                setScrollStartIndex(maxScrollStartIndex)
              }}
              sx={{
                position: 'absolute',
                right: 56,
                top: panelTop + 62,
                zIndex: 16,
                width: 16,
                height: 16,
                p: 0,
                border: `1px solid ${theme.palette.primary.main}`,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
                boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.28)}`,
                cursor: disabled === true ? 'default' : 'pointer',
                opacity: disabled === true ? 0.45 : 1,
                pointerEvents: 'auto',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-40%, -50%)',
                  borderTop: '4px solid transparent',
                  borderBottom: '4px solid transparent',
                  borderLeft: `4px solid ${theme.palette.primary.contrastText}`
                },
                '&:hover':
                  disabled === true
                    ? undefined
                    : {
                        borderColor: theme.palette.primary.light,
                        backgroundColor: theme.palette.primary.light
                      }
              }}
            />
          </>
        ) : null}
        {hideFilterButton === true ? null : (
          <Box
            component="button"
            type="button"
            title="Выбрать отображаемые узлы"
            aria-label="Выбрать отображаемые узлы"
            onClick={(event) => handleOpenPanelFilterMenu(panelKey, event)}
            sx={{
              position: 'absolute',
              right: 8,
              top: panelTop + 2,
              zIndex: 16,
              width: 16,
              height: 16,
              p: 0,
              border: `1px solid ${theme.palette.primary.main}`,
              borderRadius: '50%',
              backgroundColor: theme.palette.primary.main,
              boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.28)}`,
              cursor: 'pointer',
              pointerEvents: 'auto',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -35%)',
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: `5px solid ${theme.palette.primary.contrastText}`
              },
              '&:hover': {
                borderColor: theme.palette.primary.light,
                backgroundColor: theme.palette.primary.light,
                '&::before': {
                  borderTopColor: theme.palette.primary.contrastText
                }
              }
            }}
          />
        )}
      </>
    )
  }

  const handleHoverPreviewMouseEnter = useCallback(() => {
    if (hoverPreviewHideTimerRef.current !== null) {
      clearTimeout(hoverPreviewHideTimerRef.current)
      hoverPreviewHideTimerRef.current = null
    }
  }, [])

  const handleHoverPreviewMouseLeave = useCallback(() => {
    handleNodeMouseLeave()
  }, [handleNodeMouseLeave])
  const isMiniGraphVisible = selectedId !== null && isMiniGraphEnabled
  const mainHoverPreviewIsVisible =
    hoverPreviewIsEnabled &&
    hoveredVertexPreview !== null &&
    hoveredVertexPreview.source === 'MAIN'
  const miniHoverPreviewIsVisible =
    hoverPreviewIsEnabled &&
    hoveredVertexPreview !== null &&
    hoveredVertexPreview.source === 'MINI'

  const handleHoverPreviewReadyChange = useCallback(
    (previewKey: string, ready: boolean) => {
      setReadyHoverPreviewKey((currentReadyKey) => {
        if (ready) {
          return previewKey === hoveredVertexPreviewKey
            ? previewKey
            : currentReadyKey
        }
        return currentReadyKey === previewKey ? null : currentReadyKey
      })
    },
    [hoveredVertexPreviewKey]
  )
  const getClampedMiniGraphWidth = useCallback(
    (width: number) => {
      const graphContainerWidth =
        containerRef.current?.getBoundingClientRect().width ?? containerWidth
      const maxWidthByContainer = Math.max(
        MINI_GRAPH_MIN_WIDTH,
        graphContainerWidth - MAIN_GRAPH_MIN_WIDTH_WHEN_RESIZING
      )
      const maxWidth = Math.min(MINI_GRAPH_MAX_WIDTH, maxWidthByContainer)

      return Math.min(Math.max(width, MINI_GRAPH_MIN_WIDTH), maxWidth)
    },
    [containerRef, containerWidth]
  )

  useEffect(() => {
    setMiniGraphWidth((prevWidth) => getClampedMiniGraphWidth(prevWidth))
  }, [getClampedMiniGraphWidth])

  const handleMiniGraphSeparatorPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()

      const startX = event.clientX
      const startWidth = miniGraphWidth
      const bodyCursor = document.body.style.cursor
      const bodyUserSelect = document.body.style.userSelect

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextWidth = startWidth + startX - moveEvent.clientX
        setMiniGraphWidth(getClampedMiniGraphWidth(nextWidth))
      }

      const handlePointerUp = () => {
        document.body.style.cursor = bodyCursor
        document.body.style.userSelect = bodyUserSelect
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    },
    [getClampedMiniGraphWidth, miniGraphWidth]
  )

  const handleMiniGraphSeparatorKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return
      }

      event.preventDefault()
      setMiniGraphWidth((prevWidth) =>
        getClampedMiniGraphWidth(
          prevWidth +
            (event.key === 'ArrowLeft'
              ? MINI_GRAPH_RESIZE_STEP
              : -MINI_GRAPH_RESIZE_STEP)
        )
      )
    },
    [getClampedMiniGraphWidth]
  )

  const coverageBadgeColor = useMemo(() => {
    if (hoveredVertexPreview === null) {
      return {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText
      }
    }
    const fraction = getCoverageFractionForVertex(
      hoveredVertexPreview.data,
      selectedCoverageDisplayKey
    )
    const percent = parseCoverageFractionPercent(fraction)
    if (percent === null) {
      return {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText
      }
    }
    if (percent === 0) {
      return {
        backgroundColor: theme.palette.mode === 'dark' ? red[400] : red[500],
        color: theme.palette.common.white
      }
    }
    if (percent < 50) {
      return {
        backgroundColor:
          theme.palette.mode === 'dark' ? orange[400] : orange[500],
        color: theme.palette.common.white
      }
    }
    if (percent < 100) {
      return {
        backgroundColor: orange[300],
        color: gray[800]
      }
    }
    return {
      backgroundColor: theme.palette.mode === 'dark' ? green[500] : green[400],
      color: theme.palette.common.white
    }
  }, [hoveredVertexPreview, selectedCoverageDisplayKey, theme.palette.mode])

  if (loading) {
    return <div className="graph-loading">Загрузка графа...</div>
  }

  return (
    <StackStyled sx={{ height: '100%' }}>
      <Box
        sx={{
          px: 2,
          py: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
          alignItems: 'start',
          gap: 1.5
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ minWidth: 0 }}
        >
          <ProjButton
            variant="contained"
            type="button"
            className={`${selectedNodeId === null && selectedEdgeId === null ? 'disabled' : ''}`}
            disabled={selectedNodeId === null && selectedEdgeId === null}
            onClick={resetSelection}
          >
            Сбросить выделение
          </ProjButton>

          {isFullGraphVisible ? (
            <ProjButton
              variant="contained"
              type="button"
              onClick={() =>
                setFullGraphMaxLevel(
                  fullGraphIsExpanded ? 2 : fullGraphAvailableMaxLevel
                )
              }
            >
              {fullGraphIsExpanded ? 'Скрыть уровень' : 'Раскрыть уровень'}
            </ProjButton>
          ) : null}

          <Autocomplete
            size="small"
            options={requirementSearchOptions}
            value={selectedRequirementSearchOption}
            onChange={handleRequirementSearchChange}
            getOptionLabel={(option) => option.title}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="требования не найдены"
            renderInput={(params) => (
              <FormTextField {...params} label="поиск требования" />
            )}
            sx={{
              width: { xs: '100%', sm: 280 },
              '& .MuiInputBase-root': {
                height: 32
              }
            }}
          />
        </Stack>
        {onToggleFullscreen !== undefined ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              gap: 1
            }}
          >
            <ProjButton
              variant={
                coverageSettingsMenuAnchor !== null ? 'contained' : 'outlined'
              }
              title="Настроить отображение шкал покрытия"
              aria-label="Настроить отображение шкал покрытия"
              onClick={handleOpenCoverageSettingsMenu}
              sx={{ minWidth: 0, px: 1 }}
            >
              <TuneIcon fontSize="small" />
            </ProjButton>{' '}
            <ProjButton
              variant={isFullGraphVisible ? 'contained' : 'outlined'}
              title={
                isFullGraphVisible
                  ? 'Вернуться к компактному виду'
                  : 'Показать весь граф'
              }
              aria-label={
                isFullGraphVisible
                  ? 'Вернуться к компактному виду'
                  : 'Показать весь граф'
              }
              onClick={() => {
                setFullGraphMaxLevel(2)
                setIsFullGraphVisible((prevVisible) => !prevVisible)
              }}
              sx={{ minWidth: 0, px: 1 }}
            >
              <AccountTreeIcon fontSize="small" />
            </ProjButton>
            <ProjButton
              variant={isFullscreen ? 'contained' : 'outlined'}
              title={
                isFullscreen
                  ? 'Выйти из полноэкранного режима'
                  : 'Развернуть на весь экран'
              }
              aria-label={
                isFullscreen
                  ? 'Выйти из полноэкранного режима'
                  : 'Развернуть на весь экран'
              }
              onClick={onToggleFullscreen}
              sx={{ minWidth: 0, px: 1 }}
            >
              {isFullscreen ? (
                <FullscreenExitIcon fontSize="small" />
              ) : (
                <FullscreenIcon fontSize="small" />
              )}
            </ProjButton>
          </Box>
        ) : null}
      </Box>

      <Divider />

      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          display: 'flex',
          minHeight: 0,
          flex: 1,
          overflow: 'hidden'
        }}
      >
        <Box
          ref={mainGraphHostRef}
          onWheelCapture={handleMainGraphHostWheelCapture}
          sx={{ flex: 1, minWidth: 0, position: 'relative' }}
        >
          <ReactFlow
            key={isFullGraphVisible ? 'full-graph' : 'compact-graph'}
            style={{ width: '100%', height: '100%' }}
            nodes={allNodes}
            edges={allEdges}
            onNodeClick={handleNodeClick}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            fitView={isFullGraphVisible}
            defaultViewport={{ x: 0, y: 0, zoom: MAIN_FLOW_INITIAL_ZOOM }}
            nodesDraggable={false}
            panOnScroll={false}
            panOnScrollSpeed={1}
            panOnDrag={true}
            selectionOnDrag={false}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={true}
            minZoom={isFullGraphVisible ? 0.01 : MAIN_FLOW_MIN_ZOOM}
            maxZoom={MAIN_FLOW_MAX_ZOOM}
            proOptions={{ hideAttribution: true }}
          >
            <ReactFlowPinchZoomSensitivityController />
            {isFullGraphVisible === false ? (
              <MainGraphViewportBounds
                onViewportSettled={updateChildPanelAnchor}
              />
            ) : null}
            {isFullGraphVisible === false ? (
              <MainGraphInitialTopViewport fitKey={mainGraphInitialFitKey} />
            ) : null}
            <MainGraphAutoFitOnRequest fitRequest={mainGraphFitRequest} />
            <MainGraphFocusOnNodeRequest
              focusRequest={mainGraphFocusRequest}
              nodeId={selectedNodeId}
            />
            <Controls showInteractive={false} />
            <Background />
          </ReactFlow>
          {isFullGraphVisible === false
            ? renderLevelPrefixBadge(baseNodes)
            : null}
          {isFullGraphVisible === false && rootPanelReady
            ? renderPanelControls({
                panelKey: 'level2',
                panelTop: rootPanelAnchor.top,
                visibleCount: level1Count,
                scrollStartIndex: rootScrollStartIndex,
                setScrollStartIndex: setRootScrollStartIndex,
                disabled: expandedLevel1Id !== null,
                hideFilterButton: true
              })
            : null}
          {childFlowIsVisible && childPanelReady ? (
            <Paper
              elevation={10}
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: childPanelAnchor.top,
                height: 80,
                boxSizing: 'border-box',
                zIndex: 1,
                pointerEvents: 'none',
                border: 'none',
                background: 'transparent',
                backgroundColor: 'transparent',
                backgroundImage: 'none',
                boxShadow: 'none'
              }}
            />
          ) : null}
          {childFlowIsVisible && childPanelReady
            ? renderLevelPrefixBadge(
                childGraphData.nodes,
                childPanelAnchor.top + 8
              )
            : null}
          {childFlowIsVisible && childPanelReady
            ? renderPanelControls({
                panelKey: 'level2',
                panelTop: childPanelAnchor.top,
                visibleCount: selectedChildCount,
                scrollStartIndex: childScrollStartIndex,
                setScrollStartIndex: setChildScrollStartIndex,
                disabled: expandedLevel2Id !== null
              })
            : null}
          {grandChildFlowIsVisible && grandChildPanelReady ? (
            <Paper
              elevation={10}
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: grandChildPanelAnchor.top,
                height: 80,
                boxSizing: 'border-box',
                zIndex: 1,
                pointerEvents: 'none',
                border: 'none',
                background: 'transparent',
                backgroundColor: 'transparent',
                backgroundImage: 'none',
                boxShadow: 'none'
              }}
            />
          ) : null}
          {grandChildFlowIsVisible && grandChildPanelReady
            ? renderLevelPrefixBadge(
                grandChildGraphData.nodes,
                grandChildPanelAnchor.top + 8
              )
            : null}
          {grandChildFlowIsVisible && grandChildPanelReady
            ? renderPanelControls({
                panelKey: 'level3',
                panelTop: grandChildPanelAnchor.top,
                visibleCount: selectedGrandChildCount,
                scrollStartIndex: grandChildScrollStartIndex,
                setScrollStartIndex: setGrandChildScrollStartIndex,
                beforeScrollChange: () => setExpandedLevel3Id(null)
              })
            : null}
          {greatGrandChildFlowIsVisible && greatGrandChildPanelReady ? (
            <Paper
              elevation={10}
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: greatGrandChildPanelAnchor.top,
                height: 80,
                boxSizing: 'border-box',
                zIndex: 1,
                pointerEvents: 'none',
                border: 'none',
                background: 'transparent',
                backgroundColor: 'transparent',
                backgroundImage: 'none',
                boxShadow: 'none'
              }}
            />
          ) : null}
          {greatGrandChildFlowIsVisible && greatGrandChildPanelReady
            ? renderLevelPrefixBadge(
                greatGrandChildGraphData.nodes,
                greatGrandChildPanelAnchor.top + 8
              )
            : null}
          {greatGrandChildFlowIsVisible && greatGrandChildPanelReady
            ? renderPanelControls({
                panelKey: 'level4',
                panelTop: greatGrandChildPanelAnchor.top,
                visibleCount: selectedGreatGrandChildCount,
                scrollStartIndex: greatGrandChildScrollStartIndex,
                setScrollStartIndex: setGreatGrandChildScrollStartIndex,
                beforeScrollChange: () => setExpandedLevel4Id(null)
              })
            : null}
          {level5FlowIsVisible && level5PanelReady ? (
            <Paper
              elevation={10}
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: level5PanelAnchor.top,
                height: 80,
                boxSizing: 'border-box',
                zIndex: 1,
                pointerEvents: 'none',
                border: 'none',
                background: 'transparent',
                backgroundColor: 'transparent',
                backgroundImage: 'none',
                boxShadow: 'none'
              }}
            />
          ) : null}
          {level5FlowIsVisible && level5PanelReady
            ? renderLevelPrefixBadge(
                level5GraphData.nodes,
                level5PanelAnchor.top + 8
              )
            : null}
          {level5FlowIsVisible && level5PanelReady
            ? renderPanelControls({
                panelKey: 'level5',
                panelTop: level5PanelAnchor.top,
                visibleCount: selectedLevel5Count,
                scrollStartIndex: level5ScrollStartIndex,
                setScrollStartIndex: setLevel5ScrollStartIndex
              })
            : null}
          <Menu
            anchorEl={coverageSettingsMenuAnchor}
            open={coverageSettingsMenuAnchor !== null}
            onClose={handleCloseCoverageSettingsMenu}
            MenuListProps={{ dense: true }}
            slotProps={{
              root: {
                sx: {
                  pointerEvents: 'none'
                }
              },
              paper: {
                sx: {
                  minWidth: 560,
                  maxWidth: 720,
                  pointerEvents: 'auto'
                }
              }
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
                <Box sx={{ width: 280, py: 0.75 }}>
                  <Box sx={{ px: 2, pb: 0.75, textAlign: 'center' }}>
                    <Typography variant="subtitle2">
                      Шкалы во всплывающей подсказке
                    </Typography>
                  </Box>
                  {COVERAGE_DISPLAY_OPTIONS.map((option) => (
                    <MenuItem
                      key={`coverage-${option.key}`}
                      onClick={() => handleToggleCoverageDisplayKey(option.key)}
                    >
                      <Checkbox
                        size="small"
                        checked={visibleCoverageDisplayKeys.includes(
                          option.key
                        )}
                      />
                      <ListItemText
                        primary={option.label}
                        slotProps={{ primary: { fontSize: 13 } }}
                      />
                    </MenuItem>
                  ))}
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ width: 280, py: 0.75 }}>
                  <Box sx={{ px: 2, pb: 0.75, textAlign: 'center' }}>
                    <Typography variant="subtitle2">
                      Шкала на вершине
                    </Typography>
                  </Box>
                  {COVERAGE_DISPLAY_OPTIONS.map((option) => (
                    <MenuItem
                      key={`progress-${option.key}`}
                      onClick={() => handleSelectProgressDisplayKey(option.key)}
                    >
                      <Radio
                        size="small"
                        checked={selectedProgressDisplayKey === option.key}
                      />
                      <ListItemText
                        primary={option.label}
                        slotProps={{ primary: { fontSize: 13 } }}
                      />
                    </MenuItem>
                  ))}
                </Box>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Tooltip title="Также можно изменить в меню настроек">
                  <MenuItem onClick={handleToggleShowHoverPreview}>
                    <Checkbox
                      size="small"
                      checked={
                        popupPreviewVisibilitySettings.requirementDetails
                      }
                    />
                    <ListItemText
                      primary="Показывать всплывающее окно"
                      slotProps={{ primary: { fontSize: 13 } }}
                    />
                  </MenuItem>
                </Tooltip>
                <MenuItem
                  disabled={
                    popupPreviewVisibilitySettings.requirementDetails === false
                  }
                  onClick={handleToggleShowFragmentsInHoverPreview}
                >
                  <Checkbox
                    size="small"
                    checked={
                      popupPreviewVisibilitySettings.requirementDetails &&
                      showFragmentsInHoverPreview
                    }
                  />
                  <ListItemText
                    primary="Показывать фрагменты"
                    slotProps={{ primary: { fontSize: 13 } }}
                  />
                </MenuItem>
              </Box>
            </Box>
          </Menu>{' '}
          <Menu
            anchorEl={filterMenuAnchor}
            open={filterMenuAnchor !== null && filterMenuPanelKey !== null}
            onClose={handleClosePanelFilterMenu}
            MenuListProps={{ dense: true }}
            slotProps={{
              paper: {
                sx: {
                  maxHeight: 320,
                  minWidth: 260
                }
              }
            }}
          >
            {filterMenuPanelKey !== null ? (
              <Box sx={{ px: 1, py: 0.75 }}>
                <FormTextField
                  label="поиск"
                  value={filterMenuSearch}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                  onChange={(event) => setFilterMenuSearch(event.target.value)}
                  sx={{
                    width: '100%',
                    '& .MuiInputBase-root': {
                      height: 32
                    }
                  }}
                />
              </Box>
            ) : null}
            {filterMenuPanelKey !== null ? (
              <MenuItem
                onClick={() => {
                  const filteredVertexIds = getPanelFilterVertexes(
                    filterMenuPanelKey
                  )
                    .filter((vertex) => {
                      const code = dataForVertexId.get(vertex.id)?.code ?? ''
                      return code
                        .toLowerCase()
                        .includes(filterMenuSearch.trim().toLowerCase())
                    })
                    .map((vertex) => vertex.id)
                  handleToggleAllPanelFilterVertexes(
                    filterMenuPanelKey,
                    filteredVertexIds
                  )
                }}
              >
                <ListItemText
                  primary={(() => {
                    const filteredVertexIds = getPanelFilterVertexes(
                      filterMenuPanelKey
                    )
                      .filter((vertex) => {
                        const code = dataForVertexId.get(vertex.id)?.code ?? ''
                        return code
                          .toLowerCase()
                          .includes(filterMenuSearch.trim().toLowerCase())
                      })
                      .map((vertex) => vertex.id)
                    const allFilteredHidden = filteredVertexIds.every((id) =>
                      hiddenChildVertexIdsByPanel[filterMenuPanelKey].includes(
                        id
                      )
                    )
                    return allFilteredHidden ? 'Выбрать все' : 'Убрать все'
                  })()}
                />
              </MenuItem>
            ) : null}
            <Divider />
            {filterMenuPanelKey !== null
              ? getPanelFilterVertexes(filterMenuPanelKey)
                  .filter((vertex) => {
                    const code = dataForVertexId.get(vertex.id)?.code ?? ''
                    return code
                      .toLowerCase()
                      .includes(filterMenuSearch.trim().toLowerCase())
                  })
                  .map((vertex) => {
                    const vertexData = dataForVertexId.get(vertex.id)
                    const hiddenIds =
                      hiddenChildVertexIdsByPanel[filterMenuPanelKey]
                    const checked = !hiddenIds.includes(vertex.id)

                    return (
                      <MenuItem
                        key={vertex.id}
                        onClick={() =>
                          handleTogglePanelFilterVertex(
                            filterMenuPanelKey,
                            vertex.id
                          )
                        }
                      >
                        <Checkbox size="small" checked={checked} />
                        <ListItemText
                          primary={vertexData?.code ?? vertex.id.toString()}
                        />
                      </MenuItem>
                    )
                  })
              : null}{' '}
          </Menu>{' '}
          {mainHoverPreviewIsVisible ? (
            <Paper
              key={'MAIN-PREVIEW-' + hoveredVertexPreview.id}
              elevation={6}
              onMouseEnter={handleHoverPreviewMouseEnter}
              onMouseLeave={handleHoverPreviewMouseLeave}
              sx={{
                position: 'fixed',
                left: hoveredVertexPreview.anchor.left,
                top: hoveredVertexPreview.anchor.top,
                transform: 'translateY(-100%)',
                width: effectiveShowFragmentsInHoverPreview
                  ? 'clamp(280px, 34vw, 330px)'
                  : 'clamp(180px, 24vw, 230px)',
                visibility: hoverPreviewIsReady ? 'visible' : 'hidden',
                pointerEvents: hoverPreviewIsReady ? 'auto' : 'none',
                zIndex: theme.zIndex.tooltip,
                p: 0.6,
                borderRadius: 1
              }}
            >
              <Box
                sx={{
                  borderRadius: 1,
                  border: `2px solid ${theme.palette.divider}`,
                  backgroundColor: coverageBadgeColor.backgroundColor,
                  color: coverageBadgeColor.color,
                  px: 1,
                  py: 0.35,
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '12px'
                }}
              >
                {hoveredVertexPreview.data.code}
              </Box>
              <Stack
                spacing={0.5}
                sx={{
                  mt: 0.5,
                  p: 0.4,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.default, 0.35)
                      : alpha(theme.palette.background.default, 0.55)
                }}
              >
                {getCoverageRowsForVertex(hoveredVertexPreview.data).map(
                  ([label, value], index, array) => (
                    <Box key={label}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 0.6
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            letterSpacing: 0.15,
                            fontSize: '10px'
                          }}
                        >
                          {label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            textAlign: 'right',
                            fontSize: '12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={value}
                        >
                          {value}
                        </Typography>
                      </Box>
                      {index < array.length - 1 ? (
                        <Divider sx={{ mt: 0.3 }} />
                      ) : null}
                    </Box>
                  )
                )}
              </Stack>
              <HoverPreviewFragmentsBlock
                key={'MAIN-' + hoveredVertexPreview.id}
                requirementId={hoveredVertexPreview.id}
                active={mainHoverPreviewIsVisible}
                showFragments={effectiveShowFragmentsInHoverPreview}
                previewKey={hoveredVertexPreviewKey ?? ''}
                onReadyChange={handleHoverPreviewReadyChange}
              />
            </Paper>
          ) : null}
        </Box>

        {isMiniGraphVisible && (
          <>
            <Box
              role="separator"
              aria-orientation="vertical"
              aria-label="Изменить ширину мини-графа"
              aria-valuemin={MINI_GRAPH_MIN_WIDTH}
              aria-valuemax={getClampedMiniGraphWidth(MINI_GRAPH_MAX_WIDTH)}
              aria-valuenow={Math.round(miniGraphWidth)}
              tabIndex={0}
              onPointerDown={handleMiniGraphSeparatorPointerDown}
              onKeyDown={handleMiniGraphSeparatorKeyDown}
              sx={{
                mx: 2,
                width: 18,
                alignSelf: 'stretch',
                flex: '0 0 auto',
                cursor: 'col-resize',
                userSelect: 'none',
                touchAction: 'none',
                borderRadius: 999,
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.common.white, 0.04)
                    : alpha(theme.palette.common.black, 0.035),
                border: '1px solid',
                borderColor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.common.white, 0.14)
                    : alpha(theme.palette.common.black, 0.12),
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4,
                  borderRadius: 999,
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.common.white, 0.45)
                      : alpha(theme.palette.common.black, 0.32)
                },
                '&:hover, &:focus-visible': {
                  outline: 'none',
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.common.white, 0.08)
                      : alpha(theme.palette.common.black, 0.06),
                  '&::before': {
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.common.white, 0.7)
                        : alpha(theme.palette.common.black, 0.48)
                  }
                }
              }}
            />
            <Paper
              elevation={0}
              sx={{
                width: miniGraphWidth,
                minWidth: MINI_GRAPH_MIN_WIDTH,
                maxWidth: MINI_GRAPH_MAX_WIDTH,
                flex: '0 0 auto',
                borderRadius: 0,
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  px: 2,
                  pt: 2,
                  pb: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Typography fontSize={14} fontWeight={700} textAlign="center">
                  Мини-граф
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  justifyContent="center"
                >
                  <ProjButton
                    type="button"
                    variant={
                      miniGraphDisplayMode === 'ROOT_PATH'
                        ? 'contained'
                        : 'outlined'
                    }
                    onClick={() => {
                      setMiniGraphDisplayMode('ROOT_PATH')
                    }}
                  >
                    Путь до корня
                  </ProjButton>
                  <ProjButton
                    type="button"
                    variant={
                      miniGraphDisplayMode === 'ALL_RELATED'
                        ? 'contained'
                        : 'outlined'
                    }
                    onClick={() => {
                      setMiniGraphDisplayMode('ALL_RELATED')
                    }}
                  >
                    Показ всех
                  </ProjButton>
                </Stack>
              </Box>

              <Box
                className="nowheel nopan"
                onWheel={(event) => {
                  event.currentTarget.scrollLeft += event.deltaY + event.deltaX
                  event.preventDefault()
                }}
                sx={{
                  flex: 1,
                  minHeight: 0,
                  position: 'relative',
                  visibility: miniGraphReady ? 'visible' : 'hidden'
                }}
              >
                <ReactFlow
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: theme.palette.background.paper
                  }}
                  nodes={miniFlowData.nodes}
                  edges={miniFlowData.edges}
                  nodeTypes={nodeTypes}
                  onNodeMouseEnter={handleMiniNodeMouseEnter}
                  onNodeMouseLeave={handleNodeMouseLeave}
                  onNodeClick={handleMiniNodeClick}
                  minZoom={0.01}
                  maxZoom={1.5}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  edgesFocusable={false}
                  nodesFocusable={false}
                  panOnDrag={false}
                  panOnScroll={false}
                  zoomOnScroll={false}
                  zoomOnPinch={false}
                  zoomOnDoubleClick={false}
                  preventScrolling={false}
                  proOptions={{ hideAttribution: true }}
                >
                  <MiniGraphWheelController />
                  <MiniGraphAutoFit
                    fitKey={miniGraphFitKey}
                    setReady={setMiniGraphReady}
                  />
                  <Controls
                    showInteractive={false}
                    showZoom={true}
                    showFitView={true}
                  />
                  <Background />
                </ReactFlow>
              </Box>
            </Paper>
            {miniHoverPreviewIsVisible ? (
              <Paper
                key={'MINI-PREVIEW-' + hoveredVertexPreview.id}
                elevation={6}
                onMouseEnter={handleHoverPreviewMouseEnter}
                onMouseLeave={handleHoverPreviewMouseLeave}
                sx={{
                  position: 'fixed',
                  left: hoveredVertexPreview.anchor.left,
                  top: hoveredVertexPreview.anchor.top,
                  transform: 'translateY(-100%)',
                  width: effectiveShowFragmentsInHoverPreview
                    ? 'clamp(280px, 34vw, 330px)'
                    : 'clamp(180px, 24vw, 230px)',
                  visibility: hoverPreviewIsReady ? 'visible' : 'hidden',
                  pointerEvents: hoverPreviewIsReady ? 'auto' : 'none',
                  zIndex: theme.zIndex.tooltip,
                  p: 0.6,
                  borderRadius: 1
                }}
              >
                <Box
                  sx={{
                    borderRadius: 1,
                    border: `2px solid ${theme.palette.divider}`,
                    backgroundColor: coverageBadgeColor.backgroundColor,
                    color: coverageBadgeColor.color,
                    px: 1,
                    py: 0.35,
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '12px'
                  }}
                >
                  {hoveredVertexPreview.data.code}
                </Box>
                <Stack
                  spacing={0.5}
                  sx={{
                    mt: 0.5,
                    p: 0.4,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.default, 0.35)
                        : alpha(theme.palette.background.default, 0.55)
                  }}
                >
                  {getCoverageRowsForVertex(hoveredVertexPreview.data).map(
                    ([label, value], index, array) => (
                      <Box key={label}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 0.6
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.secondary,
                              letterSpacing: 0.15,
                              fontSize: '10px'
                            }}
                          >
                            {label}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: '11px'
                            }}
                          >
                            {value}
                          </Typography>
                        </Box>
                        {index < array.length - 1 ? (
                          <Divider sx={{ mt: 0.3 }} />
                        ) : null}
                      </Box>
                    )
                  )}
                </Stack>
                <HoverPreviewFragmentsBlock
                  key={'MINI-' + hoveredVertexPreview.id}
                  requirementId={hoveredVertexPreview.id}
                  active={miniHoverPreviewIsVisible}
                  showFragments={effectiveShowFragmentsInHoverPreview}
                  previewKey={hoveredVertexPreviewKey ?? ''}
                  onReadyChange={handleHoverPreviewReadyChange}
                />
              </Paper>
            ) : null}
          </>
        )}
      </Box>
    </StackStyled>
  )
}
