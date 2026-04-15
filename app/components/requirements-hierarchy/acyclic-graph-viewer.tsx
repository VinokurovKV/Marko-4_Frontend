// Project
import { ProjButton } from '../buttons/button'
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
  useNodesInitialized,
  useReactFlow,
  useStore,
  useEdgesState,
  useNodesState
} from 'reactflow'
import 'reactflow/dist/style.css'
// Other
import AcyclicGraphVertexViewer, {
  type AcyclicGraphVertexViewerProps,
  type AcyclicGraphVertexType,
  type VertexData
} from './acyclic-graph-vertex-viewer'
import { edgeStyle } from './requirements'
import calculateNodePositions from './graph-layouts/layout-tree'
import './styles.css'
// Material UI
import { alpha, styled, useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import AccountTreeIcon from '@mui/icons-material/AccountTree'

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
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

type AcyclicGraphNode = Node<AcyclicGraphVertexViewerProps<VertexData>>
type MiniGraphDisplayMode = 'ROOT_PATH' | 'ALL_RELATED'
type HoveredVertexPreview = {
  id: number
  level: number
  data: VertexData
}

const HOVER_PREVIEW_DELAY_MS = 400

const nodeTypes = {
  acyclicGraphVertex: AcyclicGraphVertexViewer
}

const MAIN_FLOW_MIN_ZOOM = 0.05
const MAIN_FLOW_MAX_ZOOM = 2
const MAIN_FLOW_PINCH_ZOOM_SENSITIVITY_MULTIPLIER = 4
const MINI_GRAPH_ZOOM_SENSITIVITY_MULTIPLIER = 2.5
const MINI_GRAPH_FIT_VIEW_OPTIONS = {
  padding: 0.35,
  minZoom: 0.01,
  maxZoom: 1
} as const

const isMacOs = () =>
  typeof navigator !== 'undefined' &&
  /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)

const getBaseZoomDeltaFromWheelEvent = (event: WheelEvent) => {
  const ctrlFactor = event.ctrlKey && isMacOs() ? 10 : 1
  const deltaFactor =
    event.deltaMode === 1 ? 0.05 : event.deltaMode !== 0 ? 1 : 0.002

  return -event.deltaY * deltaFactor * ctrlFactor
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

const getVertexLevel = (vertexData: VertexData): number => {
  const v = vertexData as unknown
  if (typeof v === 'object' && v !== null && 'level' in v) {
    const level = (v as Record<string, unknown>).level
    if (typeof level === 'number' && Number.isFinite(level)) return level
  }
  return 0
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
  if (selectedId === null) return []

  const vertexMap = new Map<number, Vertex>()
  vertexes.forEach((vertex) => {
    vertexMap.set(vertex.id, vertex)
  })

  const result = new Set<number>()
  const visitedUp = new Set<number>()
  const visitedDown = new Set<number>()

  const addParents = (vertexId: number) => {
    if (visitedUp.has(vertexId)) return
    visitedUp.add(vertexId)
    result.add(vertexId)

    const vertex = vertexMap.get(vertexId)
    if (!vertex) return

    vertex.parentsIds.forEach((parentId) => {
      addParents(parentId)
    })
  }

  const addChildren = (vertexId: number) => {
    if (visitedDown.has(vertexId)) return
    visitedDown.add(vertexId)
    result.add(vertexId)

    const vertex = vertexMap.get(vertexId)
    if (!vertex) return

    vertex.childIds.forEach((childId) => {
      addChildren(childId)
    })
  }

  addParents(selectedId)

  if (displayMode === 'ALL_RELATED') {
    addChildren(selectedId)
  }

  return Array.from(result).sort((a, b) => a - b)
}

const getMiniFlowData = (
  selectedId: number | null,
  vertexes: Vertex[],
  dataForVertexId: Map<number, VertexData>,
  displayMode: MiniGraphDisplayMode
): {
  nodes: AcyclicGraphNode[]
  edges: Edge[]
} => {
  const includedIds = new Set(
    getMiniGraphNodeIds(selectedId, vertexes, displayMode)
  )

  if (includedIds.size === 0) {
    return { nodes: [], edges: [] }
  }

  const includedVertexes = vertexes.filter((vertex) =>
    includedIds.has(vertex.id)
  )
  const vertexMap = new Map<number, Vertex>()
  includedVertexes.forEach((vertex) => {
    vertexMap.set(vertex.id, vertex)
  })

  const nodesByLevel = new Map<number, Vertex[]>()

  includedVertexes.forEach((vertex) => {
    const vertexData = dataForVertexId.get(vertex.id)
    if (!vertexData) return

    const level = getVertexLevel(vertexData)

    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, [])
    }

    nodesByLevel.get(level)!.push(vertex)
  })

  const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b)

  const nodes: AcyclicGraphNode[] = []
  const edges: Edge[] = []

  const levelHeight = 110
  const nodeWidth = 170
  const nodeSpacing = 30

  sortedLevels.forEach((level, levelIndex) => {
    const verticesInLevel = [...(nodesByLevel.get(level) || [])].sort(
      (a, b) => a.id - b.id
    )

    const totalWidth =
      verticesInLevel.length * nodeWidth +
      Math.max(0, verticesInLevel.length - 1) * nodeSpacing
    const startX = 180 - totalWidth / 2

    verticesInLevel.forEach((vertex, vertexIndex) => {
      const vertexData = dataForVertexId.get(vertex.id)
      if (!vertexData) return

      let type: AcyclicGraphVertexType = 'RELATED'
      if (selectedId === vertex.id) {
        type = 'SELECTED'
      }

      nodes.push({
        id: vertex.id.toString(),
        type: 'acyclicGraphVertex',
        position: {
          x: startX + vertexIndex * (nodeWidth + nodeSpacing) + nodeWidth / 2,
          y: levelIndex * levelHeight + 40
        },
        data: {
          id: vertex.id,
          level,
          hasParents: vertex.parentsIds.some((id) => includedIds.has(id)),
          hasChildren: vertex.childIds.some((id) => includedIds.has(id)),
          data: vertexData,
          type,
          dimmed: false,
          collapsed: false
        },
        draggable: false,
        selectable: false
      })
    })
  })

  includedVertexes.forEach((vertex) => {
    vertex.childIds.forEach((childId) => {
      if (!includedIds.has(childId)) return

      edges.push({
        id: `mini-${vertex.id}-${childId}`,
        source: vertex.id.toString(),
        target: childId.toString(),
        type: 'default',
        animated: false,
        ...edgeStyle
      })
    })
  })

  return { nodes, edges }
}

export default function AcyclicGraphViewer({
  vertexes,
  dataForVertexId,
  maxDisplayedLayerWhenWithoutSelected,
  setMaxDisplayedLayerWhenWithoutSelected,
  fitOnSelectedIdChange = false,
  selectedId,
  setSelectedId,
  onVertexClick,
  isFullscreen = false,
  onToggleFullscreen
}: AcyclicGraphViewerProps) {
  const {
    containerRef,
    width: containerWidth,
    height: containerHeight
  } = useContainerSize()
  const theme = useTheme()

  const convertToNodes = useCallback((): AcyclicGraphNode[] => {
    const verticesByLevel = new Map<number, Vertex[]>()
    const vertexMap = new Map<number, Vertex>()
    vertexes.forEach((vertex) => {
      vertexMap.set(vertex.id, vertex)
    })

    const selectedVertex =
      selectedId !== null ? (vertexMap.get(selectedId) ?? null) : null
    const connectedIds =
      selectedId !== null
        ? new Set(getMiniGraphNodeIds(selectedId, vertexes, 'ALL_RELATED'))
        : null
    const directlyRelatedIds =
      selectedVertex !== null
        ? new Set([...selectedVertex.parentsIds, ...selectedVertex.childIds])
        : null

    vertexes.forEach((vertex) => {
      const vertexData = dataForVertexId.get(vertex.id)
      if (!vertexData) return

      const level = getVertexLevel(vertexData)

      if (
        maxDisplayedLayerWhenWithoutSelected !== null &&
        level > maxDisplayedLayerWhenWithoutSelected
      ) {
        return
      }

      if (!verticesByLevel.has(level)) {
        verticesByLevel.set(level, [])
      }
      verticesByLevel.get(level)!.push(vertex)
    })

    const sortedLevels = Array.from(verticesByLevel.keys()).sort(
      (a, b) => a - b
    )
    const levelHeight = 150
    const nodeWidth = 200
    const nodeSpacing = 50

    const nodes: AcyclicGraphNode[] = []

    sortedLevels.forEach((level, levelIndex) => {
      const verticesInLevel = verticesByLevel.get(level)!
      const totalWidth = verticesInLevel.length * (nodeWidth + nodeSpacing)
      const startX = -totalWidth / 2

      verticesInLevel.forEach((vertex, vertexIndex) => {
        const x =
          startX + vertexIndex * (nodeWidth + nodeSpacing) + nodeWidth / 2
        const y = levelIndex * levelHeight

        const vertexData = dataForVertexId.get(vertex.id)!

        let nodeType: AcyclicGraphVertexType = 'DEFAULT'
        let dimmed = false

        if (selectedId !== null) {
          if (vertex.id === selectedId) {
            nodeType = 'SELECTED'
          } else if (directlyRelatedIds?.has(vertex.id)) {
            nodeType = 'RELATED'
          } else if (connectedIds?.has(vertex.id)) {
            nodeType = 'SECONDARY'
          } else {
            nodeType = 'DEFAULT'
            dimmed = true
          }
        }

        nodes.push({
          id: vertex.id.toString(),
          type: 'acyclicGraphVertex',
          position: { x, y },
          data: {
            id: vertex.id,
            level,
            hasParents: vertex.parentsIds.length > 0,
            hasChildren: vertex.childIds.length > 0,
            data: vertexData,
            type: nodeType,
            dimmed,
            collapsed: false
          }
        })
      })
    })

    return nodes
  }, [
    vertexes,
    dataForVertexId,
    maxDisplayedLayerWhenWithoutSelected,
    selectedId
  ])

  const convertToEdges = useCallback((): Edge[] => {
    const edges: Edge[] = []

    vertexes.forEach((vertex) => {
      vertex.childIds.forEach((childId) => {
        edges.push({
          id: `${vertex.id}-${childId}`,
          source: vertex.id.toString(),
          target: childId.toString(),
          type: 'default',
          animated: false,
          ...edgeStyle
        })
      })
    })

    return edges
  }, [vertexes])

  const [allNodes, setAllNodes, onNodesChange] = useNodesState<
    AcyclicGraphVertexViewerProps<VertexData>
  >([])
  const [allEdges, setAllEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [loading, setLoading] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [miniGraphReady, setMiniGraphReady] = useState(false)
  const [miniGraphDisplayMode, setMiniGraphDisplayMode] =
    useState<MiniGraphDisplayMode>('ALL_RELATED')
  const [isMiniGraphEnabled, setIsMiniGraphEnabled] = useState(true)
  const [hoveredVertexPreview, setHoveredVertexPreview] =
    useState<HoveredVertexPreview | null>(null)
  const [mainGraphFitRequest, setMainGraphFitRequest] = useState(0)
  const isFullscreenInitializedRef = useRef(false)
  const hoverPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  useEffect(() => {
    if (containerWidth > 0 && containerHeight > 0) {
      const nodes = convertToNodes()
      const edges = convertToEdges()

      const layoutedNodes = calculateNodePositions(
        nodes,
        vertexes,
        containerWidth,
        containerHeight
      )

      setAllNodes(layoutedNodes)
      setAllEdges(edges)
      setLoading(false)
    }
  }, [
    containerWidth,
    containerHeight,
    convertToNodes,
    convertToEdges,
    vertexes,
    setAllNodes,
    setAllEdges
  ])

  const miniFlowData = useMemo(
    () =>
      getMiniFlowData(
        selectedId,
        vertexes,
        dataForVertexId,
        miniGraphDisplayMode
      ),
    [selectedId, vertexes, dataForVertexId, miniGraphDisplayMode]
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
    if (isFullscreenInitializedRef.current === false) {
      isFullscreenInitializedRef.current = true
      return
    }

    setMainGraphFitRequest((prev) => prev + 1)
  }, [isFullscreen])

  const showNextLevel = () => {
    if (
      maxDisplayedLayerWhenWithoutSelected === null ||
      maxDisplayedLayerWhenWithoutSelected < 5
    ) {
      setMaxDisplayedLayerWhenWithoutSelected((prev) =>
        prev === null ? 1 : Math.min(prev + 1, 5)
      )
    }
  }

  const hideLastLevel = () => {
    if (
      maxDisplayedLayerWhenWithoutSelected !== null &&
      maxDisplayedLayerWhenWithoutSelected > 0
    ) {
      setMaxDisplayedLayerWhenWithoutSelected((prev) => prev! - 1)
    }
  }

  const handleNodeClick = useCallback(
    (
      _event: React.MouseEvent,
      node: Node<AcyclicGraphVertexViewerProps<VertexData>>
    ) => {
      const nodeId = node.id
      const vertexId = parseInt(nodeId, 10)

      if (selectedId === vertexId) {
        onVertexClick?.(vertexId)
        setSelectedId(null)
        setSelectedNodeId(null)
        setSelectedEdgeId(null)
        return
      }

      onVertexClick?.(vertexId)
      setSelectedId(vertexId)
      setSelectedNodeId(nodeId)
      setSelectedEdgeId(null)
    },
    [onVertexClick, setSelectedId, selectedId]
  )

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation()
    setSelectedEdgeId((prev) => (prev === edge.id ? null : edge.id))
  }, [])

  const handleNodeMouseEnter = useCallback(
    (
      _event: React.MouseEvent,
      node: Node<AcyclicGraphVertexViewerProps<VertexData>>
    ) => {
      if (hoverPreviewTimerRef.current !== null) {
        clearTimeout(hoverPreviewTimerRef.current)
      }

      const previewData: HoveredVertexPreview = {
        id: node.data.id,
        level: node.data.level,
        data: node.data.data
      }

      hoverPreviewTimerRef.current = setTimeout(() => {
        setHoveredVertexPreview(previewData)
        hoverPreviewTimerRef.current = null
      }, HOVER_PREVIEW_DELAY_MS)
    },
    []
  )

  const handleNodeMouseLeave = useCallback(() => {
    if (hoverPreviewTimerRef.current !== null) {
      clearTimeout(hoverPreviewTimerRef.current)
      hoverPreviewTimerRef.current = null
    }
    setHoveredVertexPreview(null)
  }, [])

  useEffect(() => {
    return () => {
      if (hoverPreviewTimerRef.current !== null) {
        clearTimeout(hoverPreviewTimerRef.current)
      }
    }
  }, [])

  const handlePaneClick = useCallback(() => {
    setSelectedEdgeId(null)
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setSelectedId(null)
  }, [setSelectedId])

  if (loading) {
    return <div className="graph-loading">Загрузка графа...</div>
  }

  const hideButtonDisabled = maxDisplayedLayerWhenWithoutSelected === 0
  const showButtonDisabled =
    maxDisplayedLayerWhenWithoutSelected !== null &&
    maxDisplayedLayerWhenWithoutSelected >= 5
  const isMiniGraphVisible = selectedId !== null && isMiniGraphEnabled
  const isHoverPreviewVisible = hoveredVertexPreview !== null
  const isRightPanelVisible = isMiniGraphVisible || isHoverPreviewVisible

  return (
    <StackStyled sx={{ height: '100%' }}>
      <Box
        sx={{
          px: 2,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.secondary
          }}
        >
          <Typography fontSize={12}>
            Макс. уровень: {maxDisplayedLayerWhenWithoutSelected ?? 'все'}
            {selectedId !== null && ` | Выбран: ${selectedId}`}
            {selectedEdgeId !== null && ` | Выбрана связь: ${selectedEdgeId}`}
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ flex: 1 }}
        >
          <ProjButton
            variant="contained"
            type="button"
            className={`${hideButtonDisabled ? 'disabled' : ''}`}
            disabled={hideButtonDisabled}
            onClick={hideLastLevel}
          >
            Скрыть уровень
          </ProjButton>

          <ProjButton
            variant="contained"
            type="button"
            className={`${showButtonDisabled ? 'disabled' : ''}`}
            disabled={showButtonDisabled}
            onClick={showNextLevel}
          >
            Раскрыть уровень
          </ProjButton>

          <ProjButton
            type="button"
            className={`${selectedNodeId === null && selectedEdgeId === null ? 'disabled' : ''}`}
            disabled={selectedNodeId === null && selectedEdgeId === null}
            onClick={resetSelection}
          >
            Сбросить выделение
          </ProjButton>
          {onToggleFullscreen !== undefined ? (
            <Box sx={{ ml: 'auto' }}>
              <ProjButton
                variant={isMiniGraphEnabled ? 'contained' : 'outlined'}
                title={
                  isMiniGraphEnabled ? 'Скрыть мини-граф' : 'Показать мини-граф'
                }
                aria-label={
                  isMiniGraphEnabled ? 'Скрыть мини-граф' : 'Показать мини-граф'
                }
                onClick={() =>
                  setIsMiniGraphEnabled((prevEnabled) => !prevEnabled)
                }
                sx={{ minWidth: 0, px: 1, mr: 1 }}
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
        </Stack>
      </Box>

      <Divider />

      <Box
        ref={containerRef}
        sx={{
          display: 'flex',
          minHeight: 0,
          flex: 1,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <ReactFlow
            style={{ width: '100%', height: '100%' }}
            nodes={allNodes}
            edges={allEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            fitView={fitOnSelectedIdChange}
            nodesDraggable={false}
            panOnScroll={true}
            panOnScrollSpeed={1}
            panOnDrag={[1, 2]}
            selectionOnDrag={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={true}
            minZoom={MAIN_FLOW_MIN_ZOOM}
            maxZoom={MAIN_FLOW_MAX_ZOOM}
            proOptions={{ hideAttribution: true }}
          >
            <ReactFlowPinchZoomSensitivityController />
            <MainGraphAutoFitOnRequest fitRequest={mainGraphFitRequest} />
            <Controls showInteractive={false} />
            <Background />
          </ReactFlow>
        </Box>

        {isRightPanelVisible && (
          <>
            <Box
              sx={{
                mx: 2,
                width: 18,
                alignSelf: 'stretch',
                flex: '0 0 auto',
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
                }
              }}
            />
            <Paper
              elevation={0}
              sx={{
                width: 360,
                minWidth: 360,
                maxWidth: 360,
                borderRadius: 0,
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {isHoverPreviewVisible ? (
                <Box
                  sx={{
                    p: 2
                  }}
                >
                  <Box
                    sx={{
                      mt: 0.5,
                      borderRadius: 1,
                      border: `2px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      px: 1.5,
                      py: 1,
                      textAlign: 'center',
                      fontWeight: 700
                    }}
                  >
                    {hoveredVertexPreview.data.code}
                  </Box>
                  <Stack
                    spacing={1}
                    sx={{
                      mt: 1.5,
                      p: 1.25,
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.default, 0.35)
                          : alpha(theme.palette.background.default, 0.55)
                    }}
                  >
                    {[
                      ['ID', String(hoveredVertexPreview.id)],
                      ['Уровень', String(hoveredVertexPreview.level)],
                      [
                        'Покрытие',
                        `${String(hoveredVertexPreview.data.coverage)}%`
                      ],
                      [
                        'Атомарность',
                        hoveredVertexPreview.data.atomicityFlag ? 'Да' : 'Нет'
                      ],
                      [
                        'Коэф. атомарности',
                        String(hoveredVertexPreview.data.atomicityCoef)
                      ],
                      [
                        'Модификатор',
                        hoveredVertexPreview.data.modifier || '—'
                      ],
                      ['Источник', hoveredVertexPreview.data.origin || '—'],
                      ['Тест', hoveredVertexPreview.data.test || '—']
                    ].map(([label, value], index, array) => (
                      <Box key={label}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.secondary,
                              letterSpacing: 0.2
                            }}
                          >
                            {label}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, textAlign: 'right' }}
                          >
                            {value}
                          </Typography>
                        </Box>
                        {index < array.length - 1 ? (
                          <Divider sx={{ mt: 0.9 }} />
                        ) : null}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ) : null}
              {isMiniGraphVisible ? (
                <>
                  {isHoverPreviewVisible ? <Divider /> : null}
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
                    <Typography
                      fontSize={14}
                      fontWeight={700}
                      textAlign="center"
                    >
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
                    sx={{
                      flex: 1,
                      minHeight: 0,
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
                </>
              ) : null}
            </Paper>
          </>
        )}
      </Box>
    </StackStyled>
  )
}
