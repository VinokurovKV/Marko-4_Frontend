// Project
import { ProjButton } from '../buttons/button'
import { FormTextField } from '../forms/common'
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
  useStore
} from 'reactflow'
import 'reactflow/dist/style.css'
// Other
import AcyclicGraphVertexViewer, {
  type AcyclicGraphVertexViewerProps,
  type VertexData
} from './acyclic-graph-vertex-viewer'
import { edgeStyle } from './requirements'
import calculateNodePositions from './graph-layouts/layout-new'
import { gray, green, orange, red } from '~/theme/themePrimitives'
import './styles.css'
// Material UI
import { alpha, styled, useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Autocomplete from '@mui/material/Autocomplete'
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
  onMiniVertexClick?: (vertexId: number) => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

type AcyclicGraphNode = Node<AcyclicGraphVertexViewerProps<VertexData>>
type MiniGraphDisplayMode = 'ROOT_PATH' | 'ALL_RELATED'
type HoveredVertexPreview = {
  id: number
  data: VertexData
  source: 'MAIN' | 'MINI'
}

const HOVER_PREVIEW_DELAY_MS = 400
const HOVER_PREVIEW_HIDE_DELAY_MS = 180

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

const nodeTypes = {
  acyclicGraphVertex: AcyclicGraphVertexViewer
}

const MAIN_FLOW_MIN_ZOOM = 0.05
const MAIN_FLOW_MAX_ZOOM = 2
const MAIN_FLOW_INITIAL_ZOOM = 0.5
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
  displayMode: MiniGraphDisplayMode
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

  const convertToNodes = useCallback((): AcyclicGraphNode[] => {
    const nodes: AcyclicGraphNode[] = []

    vertexes.forEach((vertex) => {
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
          type: selectedId === vertex.id ? 'SELECTED' : 'DEFAULT',
          dimmed: false,
          collapsed: false
        }
      })
    })

    return nodes
  }, [vertexes, dataForVertexId, selectedId])

  const convertToEdges = useCallback((): Edge[] => [], [])
  const [baseNodes, setBaseNodes] = useState<AcyclicGraphNode[]>([])
  const [baseEdges, setBaseEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [miniGraphReady, setMiniGraphReady] = useState(false)
  const [miniGraphDisplayMode, setMiniGraphDisplayMode] =
    useState<MiniGraphDisplayMode>('ALL_RELATED')
  const [isMiniGraphEnabled, setIsMiniGraphEnabled] = useState(false)
  const [childPanelAnchor, setChildPanelAnchor] = useState({
    left: 12,
    top: 12
  })
  const [childPanelReady, setChildPanelReady] = useState(false)
  const [childScrollStartIndex, setChildScrollStartIndex] = useState(0)
  const [hoveredVertexPreview, setHoveredVertexPreview] =
    useState<HoveredVertexPreview | null>(null)
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

  const selectedChildCount = useMemo(
    () =>
      getDirectChildVertexes(selectedId, vertexes, dataForVertexId)
        .childVertexes.length,
    [selectedId, vertexes, dataForVertexId]
  )
  useLayoutEffect(() => {
    if (containerWidth > 0 && containerHeight > 0) {
      const nodes = convertToNodes()
      const edges = convertToEdges()

      const layoutedNodes = calculateNodePositions(
        nodes,
        vertexes,
        containerWidth,
        containerHeight
      )

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
    setBaseNodes,
    setBaseEdges
  ])

  const childGraphData = useMemo(() => {
    const selectedLayoutedNode =
      selectedId !== null
        ? baseNodes.find((node) => node.id === selectedId.toString())
        : undefined
    const { childLevel, childVertexes } = getDirectChildVertexes(
      selectedId,
      vertexes,
      dataForVertexId
    )
    const visibleChildLimit = 12
    const safeChildStartIndex = Math.min(
      childScrollStartIndex,
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
            Math.max(...baseNodes.map((node) => node.position.x + nodeWidth))) /
          2
    const parentCenterX =
      (selectedLayoutedNode?.position.x ?? graphCenterX) + nodeWidth / 2
    const fullSlotsStartX =
      graphCenterX - ((visibleChildLimit - 1) * slotStep) / 2 - nodeWidth / 2
    const parentSlotIndex = Math.min(
      visibleChildLimit - 1,
      Math.max(
        0,
        Math.round((parentCenterX - fullSlotsStartX - nodeWidth / 2) / slotStep)
      )
    )
    const compactSlotIndexes = Array.from(
      { length: visibleChildLimit },
      (_value, index) => index
    ).sort(
      (a, b) => Math.abs(a - parentSlotIndex) - Math.abs(b - parentSlotIndex)
    )
    const childY = (selectedLayoutedNode?.position.y ?? 0) + 136
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
                  type: 'RELATED',
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
            id: `child-panel-${selectedId}-${vertex.id}`,
            source: selectedId?.toString() ?? '',
            target: vertex.id.toString(),
            type: 'default',
            animated: false,
            ...edgeStyle
          }))

    return { nodes, edges }
  }, [baseNodes, selectedId, vertexes, dataForVertexId, childScrollStartIndex])

  const allNodes = useMemo(
    () => [...baseNodes, ...childGraphData.nodes],
    [baseNodes, childGraphData.nodes]
  )
  const allEdges = useMemo(
    () => [...baseEdges, ...childGraphData.edges],
    [baseEdges, childGraphData.edges]
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
        miniGraphDisplayMode
      ),
    [selectedId, vertexes, dataForVertexId, miniGraphDisplayMode]
  )
  const childFlowIsVisible = selectedId !== null && selectedChildCount > 0
  const updateChildPanelAnchor = useCallback(() => {
    if (selectedNodeId === null || mainGraphHostRef.current === null) {
      return
    }

    const nodeElement = mainGraphHostRef.current.querySelector<HTMLElement>(
      `.react-flow__node[data-id="${selectedNodeId}"]`
    )

    if (nodeElement === null) {
      return
    }

    const hostRect = mainGraphHostRef.current.getBoundingClientRect()
    const nodeRect = nodeElement.getBoundingClientRect()
    const top = Math.max(12, nodeRect.bottom - hostRect.top + 8)

    setChildPanelAnchor({ left: 0, top })
    setChildPanelReady(true)
  }, [selectedNodeId])
  const handleChildPanelWheel = useCallback(
    (event: React.WheelEvent) => {
      if (selectedChildCount <= 12) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      const direction = event.deltaY + event.deltaX > 0 ? 1 : -1
      setChildScrollStartIndex((prev) =>
        Math.min(Math.max(prev + direction, 0), selectedChildCount - 12)
      )
    },
    [selectedChildCount]
  )

  const handleMainGraphHostWheelCapture = useCallback(
    (event: React.WheelEvent) => {
      if (childFlowIsVisible === false || mainGraphHostRef.current === null) {
        return
      }

      const hostRect = mainGraphHostRef.current.getBoundingClientRect()
      const pointerY = event.clientY - hostRect.top
      if (
        pointerY < childPanelAnchor.top ||
        pointerY > childPanelAnchor.top + 80
      ) {
        return
      }

      handleChildPanelWheel(event)
    },
    [childFlowIsVisible, childPanelAnchor.top, handleChildPanelWheel]
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
  }, [selectedId])

  useLayoutEffect(() => {
    if (childFlowIsVisible === false) {
      setChildPanelReady(false)
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
  }, [updateChildPanelAnchor, selectedId, childFlowIsVisible])

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
      const nodeId = node.id
      const vertexId = parseInt(nodeId, 10)

      if (selectedId === vertexId) {
        onVertexClick?.(vertexId)
        setSelectedId(null)
        setSelectedNodeId(null)
        setSelectedEdgeId(null)
        return
      }

      selectVertex(vertexId)
    },
    [onVertexClick, setSelectedId, selectedId, selectVertex]
  )

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation()
    setSelectedEdgeId((prev) => (prev === edge.id ? null : edge.id))
  }, [])

  const scheduleHoverPreview = useCallback(
    (
      node: Node<AcyclicGraphVertexViewerProps<VertexData>>,
      source: HoveredVertexPreview['source']
    ) => {
      if (hoverPreviewHideTimerRef.current !== null) {
        clearTimeout(hoverPreviewHideTimerRef.current)
        hoverPreviewHideTimerRef.current = null
      }

      if (hoverPreviewTimerRef.current !== null) {
        clearTimeout(hoverPreviewTimerRef.current)
      }

      const previewData: HoveredVertexPreview = {
        id: node.data.id,
        data: node.data.data,
        source
      }

      hoverPreviewTimerRef.current = setTimeout(() => {
        setHoveredVertexPreview(previewData)
        hoverPreviewTimerRef.current = null
      }, HOVER_PREVIEW_DELAY_MS)
    },
    []
  )

  const handleNodeMouseEnter = useCallback(
    (
      _event: React.MouseEvent,
      node: Node<AcyclicGraphVertexViewerProps<VertexData>>
    ) => {
      scheduleHoverPreview(node, 'MAIN')
    },
    [scheduleHoverPreview]
  )

  const handleMiniNodeMouseEnter = useCallback(
    (
      _event: React.MouseEvent,
      node: Node<AcyclicGraphVertexViewerProps<VertexData>>
    ) => {
      scheduleHoverPreview(node, 'MINI')
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
      hoverPreviewHideTimerRef.current = null
    }, HOVER_PREVIEW_HIDE_DELAY_MS)
  }, [])

  const handleMiniNodeClick = useCallback(
    (
      event: React.MouseEvent,
      node: Node<AcyclicGraphVertexViewerProps<VertexData>>
    ) => {
      event.stopPropagation()
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

      selectVertex(value.id, { ensureVisible: true, focus: true })
    },
    [resetSelection, selectVertex]
  )

  const isMiniGraphVisible = selectedId !== null && isMiniGraphEnabled
  const mainHoverPreviewIsVisible =
    hoveredVertexPreview !== null && hoveredVertexPreview.source === 'MAIN'
  const miniHoverPreviewIsVisible =
    hoveredVertexPreview !== null && hoveredVertexPreview.source === 'MINI'

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

  const fullCoverageBadgeColor = useMemo(() => {
    if (hoveredVertexPreview === null) {
      return {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText
      }
    }
    const fraction = hoveredVertexPreview.data.fullCoverageFraction ?? ''
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
  }, [hoveredVertexPreview, theme.palette.mode])

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
            style={{ width: '100%', height: '100%' }}
            nodes={allNodes}
            edges={allEdges}
            onNodeClick={handleNodeClick}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handlePaneClick}
            onMove={updateChildPanelAnchor}
            nodeTypes={nodeTypes}
            fitView={false}
            defaultViewport={{ x: 0, y: 0, zoom: MAIN_FLOW_INITIAL_ZOOM }}
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
            <MainGraphInitialTopViewport fitKey={mainGraphInitialFitKey} />
            <MainGraphAutoFitOnRequest fitRequest={mainGraphFitRequest} />
            <MainGraphFocusOnNodeRequest
              focusRequest={mainGraphFocusRequest}
              nodeId={selectedNodeId}
            />
            <Controls showInteractive={false} />
            <Background />
          </ReactFlow>
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
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.default, 0.16)
                    : alpha(theme.palette.background.paper, 0.08),
                boxShadow: theme.shadows[10]
              }}
            />
          ) : null}
          {childFlowIsVisible && childPanelReady && selectedChildCount > 12 ? (
            <Box
              component="input"
              type="range"
              min={0}
              max={selectedChildCount - 12}
              value={childScrollStartIndex}
              onChange={(event) => {
                setChildScrollStartIndex(Number(event.target.value))
              }}
              sx={{
                position: 'absolute',
                left: 24,
                right: 24,
                top: childPanelAnchor.top + 62,
                zIndex: 16,
                pointerEvents: 'auto',
                accentColor: theme.palette.primary.main
              }}
            />
          ) : null}
          {mainHoverPreviewIsVisible ? (
            <Paper
              elevation={6}
              sx={{
                position: 'absolute',
                left: 10,
                top: 6,
                width: 'clamp(180px, 24vw, 230px)',
                pointerEvents: 'none',
                zIndex: 20,
                p: 0.6,
                borderRadius: 1
              }}
            >
              <Box
                sx={{
                  borderRadius: 1,
                  border: `2px solid ${theme.palette.divider}`,
                  backgroundColor: fullCoverageBadgeColor.backgroundColor,
                  color: fullCoverageBadgeColor.color,
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
                {[
                  [
                    'Покрытие всех',
                    hoveredVertexPreview.data.atomicityFlag
                      ? `${hoveredVertexPreview.data.test !== '' ? '1' : '0'} / 1`
                      : (hoveredVertexPreview.data.fullCoverageFraction ??
                        '0 / 0')
                  ],
                  [
                    'Обязательные',
                    hoveredVertexPreview.data.atomicityFlag
                      ? `${hoveredVertexPreview.data.test !== '' && hoveredVertexPreview.data.modifier === 'MUST' ? '1' : '0'} / ${hoveredVertexPreview.data.modifier === 'MUST' ? '1' : '0'}`
                      : (hoveredVertexPreview.data.onlyMustCoverageFraction ??
                        '0 / 0')
                  ],
                  [
                    'Обязательные и рекомендуемые',
                    hoveredVertexPreview.data.atomicityFlag
                      ? `${hoveredVertexPreview.data.test !== '' && hoveredVertexPreview.data.modifier !== 'MAY' ? '1' : '0'} / ${hoveredVertexPreview.data.modifier !== 'MAY' ? '1' : '0'}`
                      : (hoveredVertexPreview.data
                          .mustAndShouldCoverageFraction ?? '0 / 0')
                  ],
                  [
                    'Рекомендуемые',
                    hoveredVertexPreview.data.atomicityFlag
                      ? `${hoveredVertexPreview.data.test !== '' && hoveredVertexPreview.data.modifier === 'SHOULD' ? '1' : '0'} / ${hoveredVertexPreview.data.modifier === 'SHOULD' ? '1' : '0'}`
                      : (hoveredVertexPreview.data.onlyShouldCoverageFraction ??
                        '0 / 0')
                  ],
                  [
                    'Необязательные',
                    hoveredVertexPreview.data.atomicityFlag
                      ? `${hoveredVertexPreview.data.test !== '' && hoveredVertexPreview.data.modifier === 'MAY' ? '1' : '0'} / ${hoveredVertexPreview.data.modifier === 'MAY' ? '1' : '0'}`
                      : (hoveredVertexPreview.data.onlyMayCoverageFraction ??
                        '0 / 0')
                  ],
                  ...(hoveredVertexPreview.data.atomicityFlag
                    ? [['Тест', hoveredVertexPreview.data.test || '—']]
                    : [])
                ].map(([label, value], index, array) => (
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
                ))}
              </Stack>
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
                elevation={6}
                sx={{
                  position: 'absolute',
                  right: 10,
                  top: 6,
                  width: 'clamp(180px, 24vw, 230px)',
                  pointerEvents: 'none',
                  zIndex: 20,
                  p: 0.6,
                  borderRadius: 1
                }}
              >
                <Box
                  sx={{
                    borderRadius: 1,
                    border: `2px solid ${theme.palette.divider}`,
                    backgroundColor: fullCoverageBadgeColor.backgroundColor,
                    color: fullCoverageBadgeColor.color,
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
                  {[
                    [
                      'Покрытие всех',
                      hoveredVertexPreview.data.atomicityFlag
                        ? `${hoveredVertexPreview.data.test !== '' ? '1' : '0'} / 1`
                        : (hoveredVertexPreview.data.fullCoverageFraction ??
                          '0 / 0')
                    ],
                    [
                      'Обязательные',
                      hoveredVertexPreview.data.atomicityFlag
                        ? `${hoveredVertexPreview.data.test !== '' && hoveredVertexPreview.data.modifier === 'MUST' ? '1' : '0'} / ${hoveredVertexPreview.data.modifier === 'MUST' ? '1' : '0'}`
                        : (hoveredVertexPreview.data.onlyMustCoverageFraction ??
                          '0 / 0')
                    ],
                    [
                      'Обязательные и рекомендуемые',
                      hoveredVertexPreview.data.atomicityFlag
                        ? `${hoveredVertexPreview.data.test !== '' && hoveredVertexPreview.data.modifier !== 'MAY' ? '1' : '0'} / ${hoveredVertexPreview.data.modifier !== 'MAY' ? '1' : '0'}`
                        : (hoveredVertexPreview.data
                            .mustAndShouldCoverageFraction ?? '0 / 0')
                    ],
                    [
                      'Рекомендуемые',
                      hoveredVertexPreview.data.atomicityFlag
                        ? `${hoveredVertexPreview.data.test !== '' && hoveredVertexPreview.data.modifier === 'SHOULD' ? '1' : '0'} / ${hoveredVertexPreview.data.modifier === 'SHOULD' ? '1' : '0'}`
                        : (hoveredVertexPreview.data
                            .onlyShouldCoverageFraction ?? '0 / 0')
                    ],
                    [
                      'Необязательные',
                      hoveredVertexPreview.data.atomicityFlag
                        ? `${hoveredVertexPreview.data.test !== '' && hoveredVertexPreview.data.modifier === 'MAY' ? '1' : '0'} / ${hoveredVertexPreview.data.modifier === 'MAY' ? '1' : '0'}`
                        : (hoveredVertexPreview.data.onlyMayCoverageFraction ??
                          '0 / 0')
                    ],
                    ...(hoveredVertexPreview.data.atomicityFlag
                      ? [['Тест', hoveredVertexPreview.data.test || '—']]
                      : [])
                  ].map(([label, value], index, array) => (
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
                  ))}
                </Stack>
              </Paper>
            ) : null}
          </>
        )}
      </Box>
    </StackStyled>
  )
}
