// Project
import { ProjButton } from '../buttons/button'
// React
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
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
import ConfirmationModal from './confirmation'
import ChoiceModal from './choice'
import calculateNodePositions from './graph-layouts/layout-tree'
import './styles.css'
// Material UI
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

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
  vertexes: Vertex[]
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
  addChildren(selectedId)

  return Array.from(result).sort((a, b) => a - b)
}

const getMiniFlowData = (
  selectedId: number | null,
  vertexes: Vertex[],
  dataForVertexId: Map<number, VertexData>
): {
  nodes: AcyclicGraphNode[]
  edges: Edge[]
} => {
  const includedIds = new Set(getMiniGraphNodeIds(selectedId, vertexes))

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
            level,
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

  const miniFlowData = useMemo(
    () => getMiniFlowData(selectedId, vertexes, dataForVertexId),
    [selectedId, vertexes, dataForVertexId]
  )

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
      const vertexId = parseInt(nodeId, 10)
      const nodeLevel = node.data.level

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
  }, [setSelectedId])

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

  return (
    <StackStyled sx={{ height: '100%' }}>
      <div className="graph-stats">
        <Stack direction="row" pt={2} pl={2} pr={2} spacing={1}>
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
            proOptions={{ hideAttribution: true }}
          >
            <Controls showInteractive={false} />
            <Background />
          </ReactFlow>
        </Box>

        {selectedId !== null && (
          <>
            <Divider orientation="vertical" flexItem />
            <Paper
              elevation={0}
              sx={{
                width: 360,
                minWidth: 360,
                maxWidth: 360,
                borderRadius: 0,
                backgroundColor: '#fafafa',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box
                sx={{
                  px: 2,
                  pt: 2,
                  pb: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Typography fontSize={14} fontWeight={700} textAlign="center">
                  Мини-граф
                </Typography>
              </Box>

              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ReactFlow
                  nodes={miniFlowData.nodes}
                  edges={miniFlowData.edges}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{
                    padding: 0.35,
                    minZoom: 0.01,
                    maxZoom: 1
                  }}
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
                  <Controls
                    showInteractive={false}
                    showZoom={true}
                    showFitView={true}
                  />
                  <Background />
                </ReactFlow>
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </StackStyled>
  )
}
