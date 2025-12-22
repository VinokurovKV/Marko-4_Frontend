// Project
import { ProjButton } from '../buttons/button'
// React
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
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
import { type RectangleNode } from './TechSpec/nodes'
import { edgeStyle } from './TechSpec/edges'
// import Button from './button'
import ConfirmationModal from './confirmation'
import ChoiceModal from './choice'
import calculateNodePositions from './layouts/graph_final'
// import './styles.css'
// import styles from './styles.css'
// Material UI
import { styled } from '@mui/material/styles'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StackStyled = styled(Stack)(({ theme }) => [
  {
    '&': {
      position: 'relative'
    }
    // '& .react-flow': {
    //   borderTop: `1.5px dashed ${theme.palette.mode === 'light' ? theme.palette.grey['A400'] : theme.palette.grey['600']}`
    // }
    // '& .react-flow__node': {
    //   border: 'none !important',
    //   boxShadow: 'none !important'
    // },
    // '& .react-flow__node-default': {
    //   border: 'none !important',
    //   boxShadow: 'none !important'
    // },
    // '& .react-flow__node-rectangle': {
    //   border: 'none !important',
    //   boxShadow: 'none !important'
    // },
    // '& div.rectangle': {
    //   border: '7px solid black !important',
    //   borderRadius: '10px !important'
    // },
    // '& div.rectangle.selected, & div.rectangle.related': {
    //   borderColor: 'blue !important',
    //   borderWidth: '10px !important'
    // },
    // '& div.rectangle.related': {
    //   borderStyle: 'dashed !important'
    // },
    // '& div.rectangle-content': {
    //   display: 'flex !important',
    //   flexDirection: 'column !important',
    //   alignItems: 'center !important',
    //   justifyContent: 'center !important',
    //   textAlign: 'center !important',
    //   width: '100% !important',
    //   height: '100% !important'
    // },
    // '& div.rectangle-content span': {
    //   fontWeight: '600 !important',
    //   fontSize: '2em !important'
    // },
    // '& div.graph-stats': {
    //   position: 'absolute !important',
    //   top: '10px !important',
    //   left: '10px !important',
    //   zIndex: '1000 !important',
    //   display: 'flex !important',
    //   gap: '10px !important'
    // },
    // '& button': {
    //   border: 'none !important',
    //   borderRadius: '4px !important',
    //   color: 'white !important',
    //   padding: '8px 16px !important',
    //   cursor: 'pointer !important'
    // },
    // '& button.disabled': {
    //   backgroundColor: '#ccc !important',
    //   cursor: 'not-allowed !important'
    // },
    // '& button[data-action="hide-level"]:not(.disabled)': {
    //   backgroundColor: 'red !important'
    // },
    // '& button[data-action="show-level"]:not(.disabled)': {
    //   backgroundColor: 'green !important'
    // },
    // '& button[data-action="reset-selection"]:not(.disabled)': {
    //   backgroundColor: 'blue !important'
    // },
    // '& button[data-action="delete-edge"]:not(.disabled)': {
    //   backgroundColor: 'purple !important'
    // },
    // '& button[data-action="toggle-level3-mode"]:not(.disabled)': {
    //   backgroundColor: 'navy !important'
    // },
    // '& div.levels': {
    //   padding: '8px 16px !important',
    //   backgroundColor: 'rgba(255, 255, 255, 0.9) !important',
    //   borderRadius: '4px !important',
    //   fontWeight: 'bold !important'
    // },
    // '& .modal-overlay': {
    //   position: 'fixed !important',
    //   top: '0 !important',
    //   left: '0 !important',
    //   right: '0 !important',
    //   bottom: '0 !important',
    //   backgroundColor: 'rgba(0, 0, 0, 0.5) !important',
    //   display: 'flex !important',
    //   justifyContent: 'center !important',
    //   alignItems: 'flex-start !important',
    //   paddingTop: '100px !important',
    //   zIndex: '1000 !important'
    // },
    // '& .modal-content': {
    //   background: 'white !important',
    //   borderRadius: '8px !important',
    //   boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15) !important',
    //   width: '400px !important',
    //   maxWidth: '90vw !important',
    //   animation: 'modal-appear 0.2s ease-out !important'
    // },
    // '& .modal-header': {
    //   padding: '20px 20px 0 !important',
    //   borderBottom: 'none !important'
    // },
    // '& .modal-header h3': {
    //   margin: '0 !important',
    //   color: '#333 !important',
    //   fontSize: '18px !important',
    //   fontWeight: '600 !important'
    // },
    // '& .modal-body': {
    //   padding: '20px !important'
    // },
    // '& .modal-body p': {
    //   margin: '0 !important',
    //   color: '#666 !important',
    //   lineHeight: '1.5 !important'
    // },
    // '& .modal-footer': {
    //   padding: '0 20px 20px !important',
    //   display: 'flex !important',
    //   justifyContent: 'flex-end !important',
    //   gap: '10px !important'
    // },
    // '& .modal-button': {
    //   padding: '8px 16px !important',
    //   border: 'none !important',
    //   borderRadius: '4px !important',
    //   cursor: 'pointer !important',
    //   fontSize: '14px !important',
    //   fontWeight: '500 !important',
    //   transition: 'all 0.2s !important'
    // },
    // '& .cancel-button': {
    //   backgroundColor: '#f5f5f5 !important',
    //   color: '#333 !important'
    // },
    // '& .cancel-button:hover': {
    //   backgroundColor: '#e0e0e0 !important'
    // },
    // '& .confirm-button': {
    //   backgroundColor: '#dc3545 !important',
    //   color: 'white !important'
    // },
    // '& .confirm-button:hover': {
    //   backgroundColor: '#c82333 !important'
    // },
    // '& .choice-modal-content': {
    //   background: 'white !important',
    //   borderRadius: '8px !important',
    //   boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15) !important',
    //   width: '450px !important',
    //   maxWidth: '90vw !important',
    //   animation: 'modal-appear 0.2s ease-out !important'
    // },
    // '& .choice-modal-body': {
    //   padding: '20px !important',
    //   textAlign: 'center !important'
    // },
    // '& .choice-modal-body p': {
    //   margin: '0 0 20px 0 !important',
    //   color: '#666 !important',
    //   lineHeight: '1.5 !important',
    //   fontSize: '16px !important'
    // },
    // '& .choice-modal-footer': {
    //   padding: '0 20px 20px !important',
    //   display: 'flex !important',
    //   flexDirection: 'column !important',
    //   gap: '10px !important'
    // },
    // '& .choice-modal-button': {
    //   padding: '12px 16px !important',
    //   border: 'none !important',
    //   borderRadius: '6px !important',
    //   cursor: 'pointer !important',
    //   fontSize: '14px !important',
    //   fontWeight: '500 !important',
    //   transition: 'all 0.2s !important',
    //   width: '100% !important'
    // },
    // '& .choice-modal-button.path-to-root': {
    //   backgroundColor: '#4CAF50 !important',
    //   color: 'white !important'
    // },
    // '& .choice-modal-button.path-to-root:hover': {
    //   backgroundColor: '#45a049 !important'
    // },
    // '& .choice-modal-button.subtree': {
    //   backgroundColor: '#2196F3 !important',
    //   color: 'white !important'
    // },
    // '& .choice-modal-button.subtree:hover': {
    //   backgroundColor: '#1976D2 !important'
    // },
    // '& .choice-modal-button.cancel': {
    //   backgroundColor: '#f5f5f5 !important',
    //   color: '#333 !important',
    //   border: '1px solid #ddd !important'
    // },
    // '& .choice-modal-button.cancel:hover': {
    //   backgroundColor: '#e0e0e0 !important'
    // }
    // '& .MuiDataGrid-footerContainer .MuiToolbar-root': {
    //   minHeight: ROW_HEIGHT,
    //   height: ROW_HEIGHT
    // },
    // '& .MuiDataGrid-columnHeaderTitle': {
    //   fontWeight: 'bold'
    // },
    // '& .MuiDataGrid-cell + .MuiDataGrid-cell': {
    //   borderLeft: `1px solid ${theme.palette.divider}`
    // },
    // '& .MuiDataGrid-toolbar .MuiInputBase-root': {
    //   height: TOOLBAR_INPUT_HEIGHT
    // },
    // '&.navigation-mode .MuiDataGrid-row': {
    //   cursor: 'pointer',
    //   ':hover': {
    //     backgroundColor:
    //       theme.palette.mode === 'light'
    //         ? 'rgb(239, 244, 251)'
    //         : 'rgb(40, 47, 54)'
    //   }
    // }
  }
  // theme.applyStyles('light', {
  //   '& .MuiDataGrid-toolbar, & .MuiDataGrid-columnHeaders .MuiDataGrid-filler, & .MuiDataGrid-columnHeader, .MuiToolbar-root':
  //     {
  //       backgroundColor: theme.palette.grey.A100
  //     }
  // })
])

/* eslint-disable */

const nodeTypes = {
  rectangle: Rectangle
}

export interface TopologyGraphProps {
  blurredNodeIndexes: string[]
  initialNodes: RectangleNode[]
  initialEdges: Edge[]
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

  const addChildrenUpToLevel3 = (currentId: string, currentLevel: number) => {
    if (currentLevel >= 3) return

    edges.forEach((edge) => {
      if (edge.source === currentId && !fullSubtree.has(edge.target)) {
        const targetLevel = edge.target.split('.').length - 1
        if (targetLevel <= 3) {
          fullSubtree.add(edge.target)
          addChildrenUpToLevel3(edge.target, targetLevel)
        }
      }
    })
  }

  const startLevel = nodeId.split('.').length - 1
  addChildrenUpToLevel3(nodeId, startLevel)

  return fullSubtree
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

export function TopologyGraph({
  blurredNodeIndexes,
  initialNodes,
  initialEdges
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

  const [showAllLevel3, setShowAllLevel3] = useState<boolean>(true)

  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false)
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null)

  const [nodeDisplayMode, setNodeDisplayMode] = useState<
    'path' | 'subtree' | null
  >(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [edgeToDelete, setEdgeToDelete] = useState<Edge | null>(null)

  const isHideButtonDisabled = visibleLevels <= 1 || nodeDisplayMode !== null

  const getLevel2ParentId = useCallback((nodeId: string): string | null => {
    const parts = nodeId.split('.')
    if (parts.length >= 3) {
      return parts.slice(0, 3).join('.')
    }
    return null
  }, [])

  const getSiblingLevel3Nodes = useCallback(
    (nodeId: string): Set<string> => {
      const level2ParentId = getLevel2ParentId(nodeId)
      if (!level2ParentId) return new Set()

      const siblings = new Set<string>()
      allNodes.forEach((node) => {
        if (node.data.level === 3) {
          const nodeLevel2Parent = getLevel2ParentId(node.id)
          if (nodeLevel2Parent === level2ParentId) {
            siblings.add(node.id)
          }
        }
      })

      return siblings
    },
    [allNodes, getLevel2ParentId]
  )

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
    if (isHideButtonDisabled) {
      return
    }

    if (visibleLevels > 1) {
      setVisibleLevels((prev) => prev - 1)
    }
  }

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const nodeId = node.id
    const nodeLevel = node.data.level

    if (nodeLevel === 3) {
      setClickedNodeId(nodeId)
      setIsChoiceModalOpen(true)
    } else {
      setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId))
      setSelectedEdgeId(null)
      setNodeDisplayMode('path')
    }
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

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation()
    setSelectedEdgeId((prev) => (prev === edge.id ? null : edge.id))
  }, [])

  const handlePaneClick = useCallback(() => {
    setSelectedEdgeId(null)
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

  const toggleShowAllLevel3 = useCallback(() => {
    setShowAllLevel3((prev) => !prev)
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setNodeDisplayMode(null)
    setClickedNodeId(null)
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setNodeDisplayMode(null)
  }, [])

  const filteredNodes = allNodes.filter((node) => {
    const nodeLevel = node.data.level

    if (selectedNodeId !== null && nodeDisplayMode !== null) {
      if (nodeDisplayMode === 'path') {
        const connectedNodes = getConnectedNodes(selectedNodeId)
        return connectedNodes.has(node.id)
      } else if (nodeDisplayMode === 'subtree') {
        const parentId = selectedNodeId.split('.').slice(0, -1).join('.')
        const isParent = node.id === parentId

        const inSubtree =
          node.id === selectedNodeId ||
          node.id.startsWith(selectedNodeId + '.') ||
          isParent

        if (showAllLevel3 && nodeLevel === 3) {
          const siblings = getSiblingLevel3Nodes(selectedNodeId)
          if (siblings.has(node.id)) {
            return true
          }
        }

        return inSubtree
      }
    }

    if (selectedNodeId !== null && nodeDisplayMode !== null) {
      return false
    }

    return nodeLevel < visibleLevels
  })

  const filteredEdges = allEdges.filter((edge) => {
    const sourceNode = allNodes.find((n) => n.id === edge.source)
    const targetNode = allNodes.find((n) => n.id === edge.target)
    const sourceLevel = sourceNode?.data.level || 0
    const targetLevel = targetNode?.data.level || 0

    if (selectedNodeId !== null && nodeDisplayMode !== null) {
      if (nodeDisplayMode === 'path') {
        const connectedNodes = getConnectedNodes(selectedNodeId)
        return (
          connectedNodes.has(edge.source) && connectedNodes.has(edge.target)
        )
      } else if (nodeDisplayMode === 'subtree') {
        const sourceInSubtree =
          edge.source === selectedNodeId ||
          edge.source.startsWith(selectedNodeId + '.')
        const targetInSubtree =
          edge.target === selectedNodeId ||
          edge.target.startsWith(selectedNodeId + '.')
        const parentId = selectedNodeId.split('.').slice(0, -1).join('.')
        const isParentToSelected =
          edge.source === parentId && edge.target === selectedNodeId

        if (showAllLevel3) {
          const selectedNode = allNodes.find((n) => n.id === selectedNodeId)
          if (selectedNode && selectedNode.data.level === 3) {
            const siblings = getSiblingLevel3Nodes(selectedNodeId)
            const isSiblingEdge =
              siblings.has(edge.source) &&
              edge.target === getLevel2ParentId(edge.source)
            if (isSiblingEdge) return true
          }
        }

        return isParentToSelected || (sourceInSubtree && targetInSubtree)
      }
    }

    return sourceLevel < visibleLevels && targetLevel < visibleLevels
  })

  const styledNodes = filteredNodes.map((node) => {
    const isNodeBlurred = blurredNodeIndexes.includes(node.id)
    const isSelected =
      selectedNodeId !== null && getConnectedNodes(selectedNodeId).has(node.id)
    const isMainSelected = selectedNodeId !== null && node.id === selectedNodeId

    const parentId = selectedNodeId?.split('.').slice(0, -1).join('.') || ''
    const isParent = node.id === parentId && nodeDisplayMode === 'subtree'

    let isSiblingLevel3 = false
    if (
      selectedNodeId !== null &&
      nodeDisplayMode !== null &&
      node.data.level === 3 &&
      showAllLevel3
    ) {
      const selectedNode = allNodes.find((n) => n.id === selectedNodeId)
      if (selectedNode && selectedNode.data.level === 3) {
        const siblings = getSiblingLevel3Nodes(selectedNodeId)
        isSiblingLevel3 = siblings.has(node.id)
      }
    }

    const className = [
      'rectangle',
      isMainSelected && 'selected',
      isSelected && !isMainSelected && 'related',
      selectedNodeId !== null && !isSelected && !isSiblingLevel3 && 'dimmed',
      isParent && 'parent-virtual',
      isSiblingLevel3 && !isMainSelected && 'sibling-level3'
    ]
      .filter(Boolean)
      .join(' ')

    let nodePosition = node.position
    const nodeStyle = node.style || {}

    if (isParent) {
      const selectedNode = allNodes.find((n) => n.id === selectedNodeId)
      if (selectedNode) {
        nodePosition = {
          x: selectedNode.position.x,
          y: selectedNode.position.y - 180
        }
      }
    }

    return {
      ...node,
      position: nodePosition,
      data: {
        ...node.data,
        className
      },
      style: {
        ...nodeStyle,
        opacity: isMainSelected
          ? 1
          : isParent
            ? 0.3
            : isNodeBlurred
              ? 0.3
              : isSiblingLevel3
                ? 0.5
                : 1
      }
    }
  })

  const styledEdges = filteredEdges.map((edge) => {
    const isSourceBlurred = blurredNodeIndexes.includes(edge.source)
    const isTargetBlurred = blurredNodeIndexes.includes(edge.target)
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
    <StackStyled sx={{ height: '100%' }}>
      <div className="graph-stats">
        <Stack direction="row" pt={2} pl={2} pr={2} spacing={1}>
          <ProjButton
            variant="contained"
            type="button"
            // dataAction="hide-level"
            className={`${isHideButtonDisabled ? 'disabled' : ''}`}
            disabled={isHideButtonDisabled}
            onClick={hideLastLevel}
          >
            Скрыть уровень
          </ProjButton>
          <ProjButton
            variant="contained"
            type="button"
            // dataAction="show-level"
            className={`${visibleLevels >= 4 ? 'disabled' : ''}`}
            disabled={visibleLevels >= 4}
            onClick={showNextLevel}
          >
            Раскрыть уровень
          </ProjButton>
          <ProjButton
            variant="contained"
            type="button"
            // dataAction="toggle-level3-mode"
            className={`${nodeDisplayMode !== null ? 'disabled' : ''}`}
            disabled={nodeDisplayMode !== null}
            onClick={toggleShowAllLevel3}
          >{`Узлы 3 уровня: ${showAllLevel3 ? 'Все' : 'Выбранный'}`}</ProjButton>
          <ProjButton
            variant="contained"
            type="button"
            // dataAction="reset-selection"
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
            variant="contained"
            type="button"
            // dataAction="delete-edge"
            className={`${selectedEdgeId === null ? 'disabled' : ''}`}
            disabled={selectedEdgeId === null}
            onClick={deleteSelectedEdge}
          >
            Удалить связь
          </ProjButton>
        </Stack>
        <div className="levels">
          <Typography fontSize={12}>
            Уровни: 0-{visibleLevels - 1}
            {selectedNodeId !== null && ` | Выбран: ${selectedNodeId}`}
            {selectedEdgeId !== null &&
              ` | Выбрана связь: ${selectedEdgeId.substring(1)}`}
            {nodeDisplayMode &&
              ` | Отображение: ${nodeDisplayMode === 'path' ? 'Путь до корня' : 'Поддерево'}`}
            {` | Узлы 3 уровня: ${showAllLevel3 ? 'Все' : 'Выбранный'}`}
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
    </StackStyled>
  )
}

/* eslint-enable */
