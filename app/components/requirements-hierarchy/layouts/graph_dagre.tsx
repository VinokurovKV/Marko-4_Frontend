/* eslint-disable */

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
import dagre from 'dagre'
import 'reactflow/dist/style.css'
import Rectangle from '../rectangle'
import { type RectangleNode, initialNodes } from '../TechSpec/nodes'
import { initialEdges, edgeStyle } from '../TechSpec/edges'
import Button from '../button'
// import styles from './styles.css'
import './styles.css'

const nodeTypes = {
  rectangle: Rectangle
}

interface TopologyGraphProps {
  blurredNodeIndexes: number[]
}

const NODE_WIDTH = 240
const NODE_HEIGHT = 120

const calculateDagreLayout = (
  nodes: RectangleNode[],
  edges: Edge[],
  containerWidth: number = 1200,
  containerHeight: number = 800
): RectangleNode[] => {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))

  graph.setGraph({
    rankdir: 'TB',
    align: 'DR',
    nodesep: 80,
    ranksep: 150,
    marginx: 20,
    marginy: 50,
    ranker: 'tight-tree'
  })

  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT
    })
  })

  edges.forEach((edge) => {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.setEdge(edge.source, edge.target)
    }
  })

  try {
    dagre.layout(graph)

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    nodes.forEach((node) => {
      const dagreNode = graph.node(node.id)
      if (dagreNode) {
        minX = Math.min(minX, dagreNode.x - NODE_WIDTH / 2)
        maxX = Math.max(maxX, dagreNode.x + NODE_WIDTH / 2)
        minY = Math.min(minY, dagreNode.y - NODE_HEIGHT / 2)
        maxY = Math.max(maxY, dagreNode.y + NODE_HEIGHT / 2)
      }
    })

    const graphWidth = maxX - minX
    const graphHeight = maxY - minY

    const offsetX = (containerWidth - graphWidth) / 2 - minX
    const offsetY = (containerHeight - graphHeight) / 2 - minY

    return nodes.map((node) => {
      const dagreNode = graph.node(node.id)

      return {
        ...node,
        position: {
          x: (dagreNode?.x || 0) - NODE_WIDTH / 2 + offsetX,
          y: (dagreNode?.y || 0) - NODE_HEIGHT / 2 + offsetY
        },
        data: {
          ...node.data,
          width: NODE_WIDTH,
          height: NODE_HEIGHT
        },
        style: {
          ...node.style,
          width: NODE_WIDTH,
          height: NODE_HEIGHT
        }
      }
    })
  } catch (error) {
    console.error('Dagre layout failed:', error)

    const nodesByLevel = new Map<number, RectangleNode[]>()
    nodes.forEach((node) => {
      const level = node.data.level
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, [])
      }
      nodesByLevel.get(level)!.push(node)
    })

    const positionedNodes: RectangleNode[] = []

    nodesByLevel.forEach((levelNodes, level) => {
      const levelWidth = levelNodes.length * (NODE_WIDTH + 60) - 60
      const startX = (containerWidth - levelWidth) / 2

      levelNodes.forEach((node, index) => {
        positionedNodes.push({
          ...node,
          position: {
            x: startX + index * (NODE_WIDTH + 60),
            y: 100 + level * 200
          },
          data: {
            ...node.data,
            width: NODE_WIDTH,
            height: NODE_HEIGHT
          },
          style: {
            ...node.style,
            width: NODE_WIDTH,
            height: NODE_HEIGHT
          }
        })
      })
    })

    return positionedNodes
  }
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
          height: Math.max(height - 40, 600)
        })
      }
    }

    updateSize()

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
  const [visibleLevels, setVisibleLevels] = useState(2)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  useEffect(() => {
    if (containerWidth > 0 && containerHeight > 0) {
      const layoutedNodes = calculateDagreLayout(
        initialNodes,
        initialEdges,
        containerWidth,
        containerHeight
      )
      setAllNodes(layoutedNodes)
    }
  }, [containerWidth, containerHeight])

  const getConnectedNodes = useCallback(
    (nodeId: string): Set<string> => {
      const connected = new Set<string>([nodeId])

      const traverse = (currentId: string) => {
        allEdges.forEach((edge) => {
          if (edge.source === currentId && !connected.has(edge.target)) {
            connected.add(edge.target)
            traverse(edge.target)
          }
          if (edge.target === currentId && !connected.has(edge.source)) {
            connected.add(edge.source)
            traverse(edge.source)
          }
        })
      }

      traverse(nodeId)
      return connected
    },
    [allEdges]
  )

  useEffect(() => {
    const updatedNodes = allNodes.map((node) => {
      const isNodeBlurred = blurredNodeIndexes.includes(Number(node.id))
      const isSelected =
        selectedNodeId !== null &&
        getConnectedNodes(selectedNodeId).has(node.id)
      const isMainSelected =
        selectedNodeId !== null && node.id === selectedNodeId

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

    setAllNodes(updatedNodes)
  }, [blurredNodeIndexes, selectedNodeId, allNodes.length])

  useEffect(() => {
    const updatedEdges = allEdges.map((edge) => {
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
              : 'rgba(96, 96, 96, 1)',
          width: 20,
          height: 20
        }
      }
    })

    setAllEdges(updatedEdges)
  }, [blurredNodeIndexes, selectedNodeId, selectedEdgeId, allEdges.length])
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
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id))
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
      setAllEdges((edges) => edges.filter((edge) => edge.id !== selectedEdgeId))
      setSelectedEdgeId(null)
    }
  }, [selectedEdgeId])

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

      const updatedNodes = calculateDagreLayout(
        allNodes,
        [...allEdges, newEdge],
        containerWidth,
        containerHeight
      )

      setAllNodes(updatedNodes)
    },
    [
      allNodes,
      allEdges,
      containerWidth,
      containerHeight,
      setAllNodes,
      setAllEdges
    ]
  )

  return (
    <>
      <div className="graph-stats">
        <Button
          type="button"
          text="Скрыть уровень"
          dataAction="hide-level"
          className={visibleLevels <= 1 ? 'disabled' : ''}
          disabled={visibleLevels <= 1}
          onClick={hideLastLevel}
        />
        <Button
          type="button"
          text="Раскрыть уровень"
          dataAction="show-level"
          className={visibleLevels >= 4 ? 'disabled' : ''}
          disabled={visibleLevels >= 4}
          onClick={showNextLevel}
        />
        <Button
          type="button"
          text="Сбросить выделение"
          dataAction="reset-selection"
          className={
            selectedNodeId === null && selectedEdgeId === null ? 'disabled' : ''
          }
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
          className={selectedEdgeId === null ? 'disabled' : ''}
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
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
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
          maxZoom={1.5}
        >
          <Controls />
          <MiniMap />
          <Background />
        </ReactFlow>
      </div>
    </>
  )
}

/* eslint-enable */
