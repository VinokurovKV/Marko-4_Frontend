import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import Rectangle from './rectangle'
import { type RectangleNode, initialNodes } from './TechSpec/nodes'
import { initialEdges, edgeStyle } from './TechSpec/edges'
import Button from './button'
import ConfirmationModal from './confirmation'
import './styles.css'
// import styles from './styles.css'

/* eslint-disable */

const nodeTypes = {
  rectangle: Rectangle
}

interface TopologyGraphProps {
  blurredNodeIndexes: number[]
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

const getAllChildren = (nodeId: string, edges: Edge[]): Set<string> => {
  const children = new Set<string>()

  const findChildren = (currentId: string) => {
    edges.forEach((edge) => {
      if (edge.source === currentId && !children.has(edge.target)) {
        children.add(edge.target)
        findChildren(edge.target)
      }
    })
  }

  findChildren(nodeId)
  return children
}

const getFullSubtree = (nodeId: string, edges: Edge[]): Set<string> => {
  const fullSubtree = new Set<string>([nodeId])

  const pathToRoot = getPathToRoot(nodeId, edges)
  pathToRoot.forEach((node) => fullSubtree.add(node))

  const allChildren = getAllChildren(nodeId, edges)
  allChildren.forEach((node) => fullSubtree.add(node))

  return fullSubtree
}

const sortNodeIds = (a: string, b: string): number => {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0
    const numB = partsB[i] || 0
    if (numA !== numB) {
      return numA - numB
    }
  }
  return 0
}

const calculateNodePositions = (
  leveledNodes: RectangleNode[],
  containerWidth: number,
  containerHeight: number,
  maxLevels: number = 5
): RectangleNode[] => {
  const NODE_WIDTH = 240
  const NODE_HEIGHT = 120
  const HORIZONTAL_PADDING = 20
  const VERTICAL_PADDING = 5
  const VERTICAL_SPACING = 1200

  const centerX = containerWidth / 2
  const centerY = containerHeight / 2

  const baseRadius = Math.min(containerWidth, containerHeight) * 1.4

  const nodePositions = new Map<string, { x: number; y: number }>()

  const nodesByLevel = new Map<number, RectangleNode[]>()
  leveledNodes.forEach((node) => {
    const level = node.data.level
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, [])
    }
    nodesByLevel.get(level)!.push(node)
  })

  const rootNodes = nodesByLevel.get(0) || []
  if (rootNodes.length > 0) {
    const rootNode = rootNodes[0]
    nodePositions.set(rootNode.id, { x: centerX, y: centerY })
  }

  const level1Nodes = nodesByLevel.get(1) || []
  if (level1Nodes.length > 0) {
    const sortedLevel1Nodes = level1Nodes.sort((a, b) =>
      sortNodeIds(a.id, b.id)
    )

    const levelWidth =
      3 * (NODE_WIDTH + HORIZONTAL_PADDING) - HORIZONTAL_PADDING
    const startX = (containerWidth - levelWidth) / 2 + NODE_WIDTH / 2
    const level1Y = centerY + 200

    sortedLevel1Nodes.forEach((node, index) => {
      const x = startX + index * (NODE_WIDTH + HORIZONTAL_PADDING)
      const y = level1Y
      nodePositions.set(node.id, { x, y })
    })
  }

  const level2Nodes = nodesByLevel.get(2) || []
  if (level2Nodes.length > 0) {
    const sortedLevel2Nodes = level2Nodes.sort((a, b) =>
      sortNodeIds(a.id, b.id)
    )
    const radius = baseRadius

    const startAngle = Math.PI
    const endAngle = 0
    const angleStep =
      (endAngle - startAngle) / (sortedLevel2Nodes.length - 1 || 1)

    const level2Y = centerY + 450

    sortedLevel2Nodes.forEach((node, index) => {
      const angle = startAngle + index * angleStep
      const x = centerX + radius * Math.cos(angle)
      const y = level2Y + radius * Math.sin(angle)
      nodePositions.set(node.id, { x, y })
    })
  }

  for (
    let level = 3;
    level <= Math.max(...Array.from(nodesByLevel.keys()));
    level++
  ) {
    const levelNodes = nodesByLevel.get(level) || []
    if (levelNodes.length === 0) continue

    const groupsByParent = new Map<string, RectangleNode[]>()
    levelNodes.forEach((node) => {
      const parentId = node.id.split('.').slice(0, -1).join('.')
      if (!groupsByParent.has(parentId)) {
        groupsByParent.set(parentId, [])
      }
      groupsByParent.get(parentId)!.push(node)
    })

    const allChildren = Array.from(groupsByParent.values()).flat()
    const sortedAllChildren = allChildren.sort((a, b) =>
      sortNodeIds(a.id, b.id)
    )

    const availableWidth = containerWidth - 200
    const horizontalSpacing = NODE_WIDTH + HORIZONTAL_PADDING
    const requiredWidth =
      sortedAllChildren.length * horizontalSpacing - HORIZONTAL_PADDING
    const actualWidth = Math.max(availableWidth, requiredWidth)

    const startX = (containerWidth - actualWidth) / 2 + NODE_WIDTH / 2

    const baseLevelY = centerY + baseRadius + VERTICAL_SPACING
    const levelY =
      baseLevelY + (level - 3) * (NODE_HEIGHT * 30 + VERTICAL_SPACING)

    console.log(`=== Уровень ${level} ===`)
    console.log(`containerWidth: ${containerWidth}, centerX: ${centerX}`)
    console.log(
      `availableWidth: ${availableWidth}, requiredWidth: ${requiredWidth}, actualWidth: ${actualWidth}`
    )
    console.log(`startX: ${startX}, levelY: ${levelY}`)
    console.log(`Количество узлов: ${sortedAllChildren.length}`)

    sortedAllChildren.forEach((node, index) => {
      const x = startX + index * horizontalSpacing

      const heightLevel = index % 30
      let yOffset = 0

      switch (heightLevel) {
        case 0:
          yOffset = 0
          break
        case 1:
          yOffset = NODE_HEIGHT + VERTICAL_PADDING
          break
        case 2:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 2
          break
        case 3:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 3
          break
        case 4:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 4
          break
        case 5:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 5
          break
        case 6:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 6
          break
        case 7:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 7
          break
        case 8:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 8
          break
        case 9:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 9
          break
        case 10:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 10
          break
        case 11:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 11
          break
        case 12:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 12
          break
        case 13:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 13
          break
        case 14:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 14
          break
        case 15:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 15
          break
        case 16:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 16
          break
        case 17:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 17
          break
        case 18:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 18
          break
        case 19:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 19
          break
        case 20:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 20
          break
        case 21:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 21
          break
        case 22:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 22
          break
        case 23:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 23
          break
        case 24:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 24
          break
        case 25:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 25
          break
        case 26:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 26
          break
        case 27:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 27
          break
        case 28:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 28
          break
        case 29:
          yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 29
          break
      }

      const y = levelY + yOffset
      nodePositions.set(node.id, { x, y })

      if (level === 3) {
        console.log(
          `Узел ${node.id}: index=${index}, x=${Math.round(x)}, y=${Math.round(y)}, heightLevel=${heightLevel}, yOffset=${yOffset}`
        )
      }
    })

    if (level === 3) {
      console.log(`=== Итоги уровня 3 ===`)
      console.log(
        `Первый узел: x=${Math.round(startX)}, y=${Math.round(levelY)}`
      )
      console.log(
        `Последний узел: x=${Math.round(startX + (sortedAllChildren.length - 1) * horizontalSpacing)}, y=${Math.round(levelY + (NODE_HEIGHT + VERTICAL_PADDING) * 29)}`
      )
    }
  }

  return leveledNodes.map((node) => {
    const position = nodePositions.get(node.id) || { x: 0, y: 0 }
    const levelNodes = nodesByLevel.get(node.data.level) || []

    return {
      ...node,
      position,
      data: {
        ...node.data,
        nodesInLevel: levelNodes.length,
        width: NODE_WIDTH,
        height: NODE_HEIGHT
      }
    }
  })
}

const calculateLayout = (
  nodes: RectangleNode[],
  edges: Edge[],
  containerWidth: number,
  containerHeight: number,
  maxLevels: number = 5
): RectangleNode[] => {
  return calculateNodePositions(
    nodes,
    containerWidth,
    containerHeight,
    maxLevels
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
    }

    window.addEventListener('resize', updateSize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  return { containerRef, ...size }
}

export default function TopologyGraph({
  blurredNodeIndexes
}: TopologyGraphProps) {
  const {
    containerRef,
    width: containerWidth,
    height: containerHeight
  } = useContainerSize()
  const [allNodes, setAllNodes, onNodesChange] = useNodesState(initialNodes)
  const [allEdges, setAllEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [loading, setLoading] = useState(true)
  const [visibleLevels, setVisibleLevels] = useState(2)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [edgeToDelete, setEdgeToDelete] = useState<Edge | null>(null)

  const getConnectedNodes = useCallback(
    (nodeId: string): Set<string> => {
      if (!nodeId) return new Set()
      return getFullSubtree(nodeId, allEdges)
    },
    [allEdges]
  )

  const isValidConnection = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return false

      const sourceNode = allNodes.find((n) => n.id === connection.source)
      const targetNode = allNodes.find((n) => n.id === connection.target)
      const sourceLevel = sourceNode?.data.level || 0
      const targetLevel = targetNode?.data.level || 0

      return targetLevel === sourceLevel + 1
    },
    [allNodes]
  )

  const showNextLevel = () => {
    if (visibleLevels < 4) {
      setVisibleLevels((prev) => prev + 1)
    }
  }

  const hideLastLevel = () => {
    if (visibleLevels > 1) {
      setVisibleLevels((prev) => prev - 1)
    }
  }

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const nodeId = node.id
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId))
    setSelectedEdgeId(null)
  }, [])

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation()
    setSelectedEdgeId((prev) => (prev === edge.id ? null : edge.id))
  }, [])

  const handlePaneClick = useCallback(() => {
    setSelectedEdgeId(null)
    setSelectedNodeId(null)
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

  const filteredNodes = allNodes.filter((node) => {
    const nodeLevel = node.data.level

    if (selectedNodeId !== null) {
      const connectedNodes = getConnectedNodes(selectedNodeId)
      return connectedNodes.has(node.id)
    }

    return nodeLevel < visibleLevels
  })

  const filteredEdges = allEdges.filter((edge) => {
    const sourceNode = allNodes.find((n) => n.id === edge.source)
    const targetNode = allNodes.find((n) => n.id === edge.target)
    const sourceLevel = sourceNode?.data.level || 0
    const targetLevel = targetNode?.data.level || 0

    if (selectedNodeId !== null) {
      const connectedNodes = getConnectedNodes(selectedNodeId)
      return connectedNodes.has(edge.source) && connectedNodes.has(edge.target)
    }

    return sourceLevel < visibleLevels && targetLevel < visibleLevels
  })

  const styledNodes = filteredNodes.map((node) => {
    const isNodeBlurred = blurredNodeIndexes.includes(Number(node.id))
    const isSelected =
      selectedNodeId !== null && getConnectedNodes(selectedNodeId).has(node.id)
    const isMainSelected = selectedNodeId !== null && node.id === selectedNodeId

    const className = [
      'rectangle',
      isMainSelected && 'selected',
      isSelected && !isMainSelected && 'related',
      selectedNodeId !== null && !isSelected && 'dimmed'
    ]
      .filter(Boolean)
      .join(' ')

    return {
      ...node,
      data: {
        ...node.data,
        className
      },
      style: {
        ...node.style,
        opacity: isNodeBlurred ? 0.3 : 1
      }
    }
  })

  const styledEdges = filteredEdges.map((edge) => {
    const isSourceBlurred = blurredNodeIndexes.includes(Number(edge.source))
    const isTargetBlurred = blurredNodeIndexes.includes(Number(edge.target))
    const isEdgeBlurred = isSourceBlurred || isTargetBlurred

    const isSelected =
      selectedNodeId !== null &&
      (getConnectedNodes(selectedNodeId).has(edge.source) ||
        getConnectedNodes(selectedNodeId).has(edge.target))

    const isManuallySelected = selectedEdgeId === edge.id

    return {
      ...edge,
      style: {
        ...edge.style,
        stroke: isManuallySelected
          ? 'rgba(0, 255, 255, 1)'
          : isEdgeBlurred
            ? 'rgba(96, 96, 96, 0.2)'
            : 'rgba(96, 96, 96, 1)',
        strokeWidth: 2
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isManuallySelected
          ? 'rgba(0, 255, 255, 1)'
          : isEdgeBlurred
            ? 'rgba(224, 224, 224, 1)'
            : 'rgba(96, 96, 96, 1)'
      }
    }
  })

  useEffect(() => {
    if (containerWidth > 0 && containerHeight > 0) {
      const layoutedNodes = calculateLayout(
        initialNodes,
        initialEdges,
        containerWidth,
        containerHeight
      )
      setAllNodes(layoutedNodes)
      setAllEdges(initialEdges)
      setLoading(false)
    }
  }, [containerWidth, containerHeight])

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return

      const newEdgeId = `e${params.source}-${params.target}-${Date.now()}`

      const newEdge: Edge = {
        id: newEdgeId,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        ...edgeStyle
      }

      setAllEdges((edges) => addEdge(newEdge, edges))
    },
    [setAllEdges]
  )

  if (loading) {
    return <div className="graph-loading">Загрузка графа...</div>
  }

  return (
    <>
      <div className="graph-stats">
        <Button
          type="button"
          text="Скрыть уровень"
          dataAction="hide-level"
          className={`${visibleLevels <= 1 ? 'disabled' : ''}`}
          disabled={visibleLevels <= 1}
          onClick={hideLastLevel}
        />
        <Button
          type="button"
          text="Раскрыть уровень"
          dataAction="show-level"
          className={`${visibleLevels >= 4 ? 'disabled' : ''}`}
          disabled={visibleLevels >= 4}
          onClick={showNextLevel}
        />
        <Button
          type="button"
          text="Сбросить выделение"
          dataAction="reset-selection"
          className={`${selectedNodeId === null && selectedEdgeId === null ? 'disabled' : ''}`}
          disabled={selectedNodeId === null && selectedEdgeId === null}
          onClick={() => {
            setSelectedNodeId(null)
            setSelectedEdgeId(null)
          }}
        />
        <Button
          type="button"
          text="Удалить связь"
          dataAction="delete-edge"
          className={`${selectedEdgeId === null ? 'disabled' : ''}`}
          disabled={selectedEdgeId === null}
          onClick={deleteSelectedEdge}
        />
        <div className="levels">
          Уровни: 0-{visibleLevels - 1}
          {selectedNodeId !== null && ` | Выбран: ${selectedNodeId}`}
          {selectedEdgeId !== null &&
            ` | Выбрана связь: ${selectedEdgeId.substring(1)}`}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Удаление связи"
        message={`Вы уверены, что хотите удалить связь между узлами ${edgeToDelete?.source} и ${edgeToDelete?.target}?`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Удалить"
        cancelText="Отмена"
      />

      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        isValidConnection={isValidConnection}
        fitView={true}
        minZoom={0.05}
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </>
  )
}

/* eslint-enable */
