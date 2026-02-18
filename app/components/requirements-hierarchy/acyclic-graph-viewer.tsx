// Project
import { ProjButton } from '../buttons/button'
// React
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Edge,
  type Node
} from 'reactflow'
import 'reactflow/dist/style.css'
// Other
import AcyclicGraphVertexViewer, {
  type AcyclicGraphVertexViewerProps,
  type AcyclicGraphVertexType,
  type VertexData
} from './acyclic-graph-vertex-viewer'
import { edgeStyle } from './requirements'
import ConfirmationModal from './confirmation'
import ChoiceModal from './choice'
//import calculateNodePositions from './layout_final'
import calculateNodePositions from './layout_tree'
import './styles.css'
//Material UI
import { styled } from '@mui/material/styles'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const StackStyled = styled(Stack)(({ theme }) => [
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
}

type AcyclicGraphNode = Node<AcyclicGraphVertexViewerProps<VertexData>>

const nodeTypes = {
  acyclicGraphVertex: AcyclicGraphVertexViewer
}

const getVertexLevel = (vertexData: VertexData): number => {
  const v = vertexData as unknown
  if (typeof v === 'object' && v !== null && 'level' in v) {
    const level = (v as Record<string, unknown>).level
    if (typeof level === 'number' && Number.isFinite(level)) return level
  }
  return 0
}

const getPathToRoot = (nodeId: string, edges: Edge[]): Set<string> => {
  const path = new Set<string>([nodeId])

  const findParents = (currentId: string) => {
    edges.forEach((edge) => {
      if (edge.target === currentId && !path.has(edge.source)) {
        path.add(edge.source)
        findParents(edge.source)
      }
    })
  }

  findParents(nodeId)
  return path
}

const getFullSubtree = (nodeId: string, edges: Edge[]): Set<string> => {
  const fullSubtree = new Set<string>([nodeId])

  const pathToRoot = getPathToRoot(nodeId, edges)
  pathToRoot.forEach((node) => fullSubtree.add(node))

  const addChildren = (currentId: string) => {
    edges.forEach((edge) => {
      if (edge.source === currentId && !fullSubtree.has(edge.target)) {
        fullSubtree.add(edge.target)
        addChildren(edge.target)
      }
    })
  }

  addChildren(nodeId)
  return fullSubtree
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
    }

    window.addEventListener('resize', updateSize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  return { containerRef, ...size }
}

export default function AcyclicGraphViewer({
  vertexes,
  dataForVertexId,
  maxDisplayedLayerWhenWithoutSelected,
  setMaxDisplayedLayerWhenWithoutSelected,
  fitOnSelectedIdChange = false,
  selectedId,
  setSelectedId,
  onVertexClick
}: AcyclicGraphViewerProps) {
  const {
    containerRef,
    width: containerWidth,
    height: containerHeight
  } = useContainerSize()

  const convertToNodes = useCallback((): AcyclicGraphNode[] => {
    const verticesByLevel = new Map<number, Vertex[]>()

    const vertexMap = new Map<number, Vertex>()
    vertexes.forEach((v) => vertexMap.set(v.id, v))

    const selectedVertex =
      selectedId !== null ? vertexMap.get(selectedId) : null

    const relatedIds = new Set<number>()
    if (selectedVertex) {
      selectedVertex.parentsIds.forEach((id) => relatedIds.add(id))
      selectedVertex.childIds.forEach((id) => relatedIds.add(id))
    }

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

        if (selectedId !== null) {
          if (vertex.id === selectedId) {
            nodeType = 'SELECTED'
          } else if (relatedIds.has(vertex.id)) {
            nodeType = 'RELATED'
          } else {
            nodeType = 'SECONDARY'
          }
        }

        nodes.push({
          id: vertex.id.toString(),
          type: 'acyclicGraphVertex',
          position: { x, y },
          data: {
            id: vertex.id,
            level: level,
            hasParents: vertex.parentsIds.length > 0,
            hasChildren: vertex.childIds.length > 0,
            data: vertexData,
            type: nodeType,
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

  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false)
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null)
  const [nodeDisplayMode, setNodeDisplayMode] = useState<
    'path' | 'subtree' | null
  >(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [edgeToDelete, setEdgeToDelete] = useState<Edge | null>(null)

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
      event: React.MouseEvent,
      node: Node<AcyclicGraphVertexViewerProps<VertexData>>
    ) => {
      const nodeId = node.id
      const vertexId = parseInt(nodeId)
      const nodeData = node.data
      const nodeLevel = nodeData.level

      if (selectedId === vertexId) {
        onVertexClick?.(vertexId)
        setSelectedId(null)
        setSelectedNodeId(null)
        setSelectedEdgeId(null)
        setNodeDisplayMode(null)
        return
      }

      onVertexClick?.(vertexId)
      setSelectedId(vertexId)

      if (nodeLevel === 3) {
        setClickedNodeId(nodeId)
        setIsChoiceModalOpen(true)
      } else {
        setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId))
        setSelectedEdgeId(null)
        setNodeDisplayMode('path')
      }
    },
    [onVertexClick, setSelectedId, selectedId]
  )

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation()
    setSelectedEdgeId((prev) => (prev === edge.id ? null : edge.id))
  }, [])

  const handlePaneClick = useCallback(() => {
    setSelectedEdgeId(null)
  }, [])

  const handlePathToRoot = useCallback(() => {
    if (clickedNodeId) {
      setSelectedNodeId(clickedNodeId)
      setNodeDisplayMode('path')
    }
    setIsChoiceModalOpen(false)
    setClickedNodeId(null)
  }, [clickedNodeId])

  const handleSubtree = useCallback(() => {
    if (clickedNodeId) {
      setSelectedNodeId(clickedNodeId)
      setNodeDisplayMode('subtree')
    }
    setIsChoiceModalOpen(false)
    setClickedNodeId(null)
  }, [clickedNodeId])

  const handleCancelChoice = useCallback(() => {
    setIsChoiceModalOpen(false)
    setClickedNodeId(null)
  }, [])

  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdgeId) {
      const edge = allEdges.find((e) => e.id === selectedEdgeId)
      if (edge) {
        setEdgeToDelete(edge)
        setIsDeleteModalOpen(true)
      }
    }
  }, [selectedEdgeId, allEdges])

  const confirmDelete = useCallback(() => {
    if (edgeToDelete) {
      setAllEdges((edges) =>
        edges.filter((edge) => edge.id !== edgeToDelete.id)
      )
      setSelectedEdgeId(null)
    }
    setIsDeleteModalOpen(false)
    setEdgeToDelete(null)
  }, [edgeToDelete, setAllEdges])

  const cancelDelete = useCallback(() => {
    setIsDeleteModalOpen(false)
    setEdgeToDelete(null)
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setNodeDisplayMode(null)
    setSelectedId(null)
  }, [])

  const filteredNodes = allNodes.filter((node) => {
    if (selectedNodeId !== null && nodeDisplayMode !== null) {
      const connectedNodes = getFullSubtree(selectedNodeId, allEdges)
      return connectedNodes.has(node.id)
    }
    return true
  })

  const filteredEdges = allEdges.filter((edge) => {
    if (selectedNodeId !== null && nodeDisplayMode !== null) {
      const connectedNodes = getFullSubtree(selectedNodeId, allEdges)
      return connectedNodes.has(edge.source) && connectedNodes.has(edge.target)
    }
    return true
  })

  if (loading) {
    return <div className="graph-loading">Загрузка графа...</div>
  }

  const hideButtonDisabled = maxDisplayedLayerWhenWithoutSelected === 0
  const showButtonDisabled =
    maxDisplayedLayerWhenWithoutSelected !== null &&
    maxDisplayedLayerWhenWithoutSelected >= 5

  console.log('levels', vertexes.map(v => [v.id, getVertexLevel(dataForVertexId.get(v.id)!) ]))

  return (
    <StackStyled sx={{ height: '100%' }}>
      <div className="graph-stats">
        <Stack direction="row" pt={2} pl={2} pr={2} spacing={1}>
          <ProjButton
            variant="contained"
            type="button"
            //dataAction="hide-level"
            className={`${hideButtonDisabled ? 'disabled' : ''}`}
            disabled={hideButtonDisabled}
            onClick={hideLastLevel}
          >
            Скрыть уровень
          </ProjButton>
          <ProjButton
            variant="contained"
            type="button"
            //dataAction="show-level"
            className={`${showButtonDisabled ? 'disabled' : ''}`}
            disabled={showButtonDisabled}
            onClick={showNextLevel}
          >
            Раскрыть уровень
          </ProjButton>
          <ProjButton
            type="button"
            //dataAction="reset-selection"
            className={`${selectedNodeId === null && selectedEdgeId === null && nodeDisplayMode === null ? 'disabled' : ''}`}
            disabled={
              selectedNodeId === null &&
              selectedEdgeId === null &&
              nodeDisplayMode === null
            }
            onClick={resetSelection}
          >
            Сбросить выделение
          </ProjButton>
          <ProjButton
            type="button"
            //dataAction="delete-edge"
            className={`${selectedEdgeId === null ? 'disabled' : ''}`}
            disabled={selectedEdgeId === null}
            onClick={deleteSelectedEdge}
          >
            Удалить связь
          </ProjButton>
        </Stack>
        <div className="levels">
          <Typography fontSize={12}>
            Макс. уровень: {maxDisplayedLayerWhenWithoutSelected ?? 'все'}
            {selectedId !== null && ` | Выбран: ${selectedId}`}
            {selectedEdgeId !== null && ` | Выбрана связь: ${selectedEdgeId}`}
            {nodeDisplayMode &&
              ` | Отображение: ${nodeDisplayMode === 'path' ? 'Путь до корня' : 'Поддерево'}`}
          </Typography>
        </div>
      </div>
      <Divider />

      <ChoiceModal
        isOpen={isChoiceModalOpen}
        title="Выбор отображения"
        message={`Выберите способ отображения для узла ${clickedNodeId}`}
        onPathToRoot={handlePathToRoot}
        onSubtree={handleSubtree}
        onCancel={handleCancelChoice}
        nodeId={clickedNodeId || ''}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Удаление связи"
        message={`Вы уверены, что хотите удалить связь между узлами ${edgeToDelete?.source} и ${edgeToDelete?.target}?`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Удалить"
        cancelText="Отмена"
      />

      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', minHeight: 400 }}
      >
        <ReactFlow
          style={{ width: '100%', height: '100%' }}
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView={fitOnSelectedIdChange}
          minZoom={0.05}
          nodesDraggable={false}
          panOnScroll={true}
          panOnScrollSpeed={1}
          panOnDrag={[1, 2]}
          selectionOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={true}
        >
          <Controls showInteractive={false} />
          <Background />
        </ReactFlow>
      </div>
    </StackStyled>
  )
}
