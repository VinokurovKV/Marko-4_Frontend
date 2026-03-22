import { type Node } from 'reactflow'
import {
  type AcyclicGraphVertexViewerProps,
  type VertexData
} from '../acyclic-graph-vertex-viewer'
import { type Vertex } from '../acyclic-graph-viewer'

/* eslint-disable */

type AcyclicGraphNode = Node<AcyclicGraphVertexViewerProps<VertexData>>

const calculateNodePositions = (
  leveledNodes: AcyclicGraphNode[],
  vertexes: Vertex[],
  containerWidth: number,
  containerHeight: number,
  maxLevels: number = 5
): AcyclicGraphNode[] => {
  const NODE_WIDTH = 240
  const NODE_HEIGHT = 120
  const GRID_X_STEP = 320
  const GRID_Y_STEP = 220
  const TOP_PADDING = 80
  const MIN_LEFT_PADDING = 120
  const SWEEP_ITERATIONS = 6

  const nodePositions = new Map<string, { x: number; y: number }>()
  const vertexMap = new Map<number, Vertex>()
  const nodesByLevel = new Map<number, AcyclicGraphNode[]>()
  const parentIdsMap = new Map<string, string[]>()
  const childrenIdsMap = new Map<string, string[]>()

  vertexes.forEach((vertex) => {
    vertexMap.set(vertex.id, vertex)
  })

  leveledNodes.forEach((node) => {
    const level = node.data.level

    if (level >= maxLevels) return

    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, [])
    }

    nodesByLevel.get(level)!.push(node)
    parentIdsMap.set(node.id, [])
    childrenIdsMap.set(node.id, [])
  })

  vertexes.forEach((vertex) => {
    const nodeId = vertex.id.toString()
    const parentIds = vertex.parentsIds
      .map((id) => id.toString())
      .filter((id) => parentIdsMap.has(id))

    if (parentIdsMap.has(nodeId)) {
      parentIdsMap.set(nodeId, parentIds)
    }

    parentIds.forEach((parentId) => {
      if (!childrenIdsMap.has(parentId)) {
        childrenIdsMap.set(parentId, [])
      }
      childrenIdsMap.get(parentId)!.push(nodeId)
    })
  })

  const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b)

  const orderIndexByLevel = new Map<number, Map<string, number>>()

  const rebuildOrderIndex = (): void => {
    orderIndexByLevel.clear()

    sortedLevels.forEach((level) => {
      const nodes = nodesByLevel.get(level) || []
      const levelOrder = new Map<string, number>()

      nodes.forEach((node, index) => {
        levelOrder.set(node.id, index)
      })

      orderIndexByLevel.set(level, levelOrder)
    })
  }

  const initializeOrder = (): void => {
    sortedLevels.forEach((level) => {
      const nodes = nodesByLevel.get(level) || []

      nodes.sort((a, b) => {
        const aId = parseInt(a.id, 10)
        const bId = parseInt(b.id, 10)
        return aId - bId
      })

      nodesByLevel.set(level, nodes)
    })

    rebuildOrderIndex()
  }

  const getNeighborAverageOrder = (
    nodeId: string,
    neighborLevel: number,
    direction: 'parents' | 'children'
  ): number => {
    const neighborOrder = orderIndexByLevel.get(neighborLevel)
    if (!neighborOrder) return Number.POSITIVE_INFINITY

    const neighborIds =
      direction === 'parents'
        ? parentIdsMap.get(nodeId) || []
        : childrenIdsMap.get(nodeId) || []

    const valid = neighborIds
      .map((id) => neighborOrder.get(id))
      .filter((value): value is number => value !== undefined)

    if (valid.length === 0) {
      return Number.POSITIVE_INFINITY
    }

    return valid.reduce((sum, value) => sum + value, 0) / valid.length
  }

  const sortLevelByBarycenter = (
    level: number,
    direction: 'down' | 'up'
  ): void => {
    const levelNodes = nodesByLevel.get(level) || []
    if (levelNodes.length <= 1) return

    const referenceLevel = direction === 'down' ? level - 1 : level + 1
    const neighborType = direction === 'down' ? 'parents' : 'children'

    const decorated = levelNodes.map((node, originalIndex) => ({
      node,
      originalIndex,
      barycenter: getNeighborAverageOrder(node.id, referenceLevel, neighborType)
    }))

    decorated.sort((a, b) => {
      const aFinite = Number.isFinite(a.barycenter)
      const bFinite = Number.isFinite(b.barycenter)

      if (aFinite && bFinite) {
        if (a.barycenter !== b.barycenter) {
          return a.barycenter - b.barycenter
        }
        return a.originalIndex - b.originalIndex
      }

      if (aFinite) return -1
      if (bFinite) return 1

      return a.originalIndex - b.originalIndex
    })

    nodesByLevel.set(
      level,
      decorated.map((item) => item.node)
    )
  }

  const reduceCrossings = (): void => {
    initializeOrder()

    for (let iteration = 0; iteration < SWEEP_ITERATIONS; iteration++) {
      for (let i = 1; i < sortedLevels.length; i++) {
        sortLevelByBarycenter(sortedLevels[i], 'down')
        rebuildOrderIndex()
      }

      for (let i = sortedLevels.length - 2; i >= 0; i--) {
        sortLevelByBarycenter(sortedLevels[i], 'up')
        rebuildOrderIndex()
      }
    }
  }

  const columnByNodeId = new Map<string, number>()

  const getDesiredColumnFromParents = (nodeId: string): number | null => {
    const parentIds = parentIdsMap.get(nodeId) || []
    const parentColumns = parentIds
      .map((parentId) => columnByNodeId.get(parentId))
      .filter((value): value is number => value !== undefined)

    if (parentColumns.length === 0) return null

    return (
      parentColumns.reduce((sum, value) => sum + value, 0) / parentColumns.length
    )
  }

  const getDesiredColumnFromChildren = (nodeId: string): number | null => {
    const childIds = childrenIdsMap.get(nodeId) || []
    const childColumns = childIds
      .map((childId) => columnByNodeId.get(childId))
      .filter((value): value is number => value !== undefined)

    if (childColumns.length === 0) return null

    return (
      childColumns.reduce((sum, value) => sum + value, 0) / childColumns.length
    )
  }

  const assignRootColumns = (): void => {
    const rootLevel = sortedLevels[0]
    const rootNodes = nodesByLevel.get(rootLevel) || []

    rootNodes.forEach((node, index) => {
      columnByNodeId.set(node.id, index)
    })
  }

  const assignColumnsTopDown = (): void => {
    for (let i = 1; i < sortedLevels.length; i++) {
      const level = sortedLevels[i]
      const nodes = nodesByLevel.get(level) || []

      const desired = nodes.map((node, index) => ({
        node,
        fallbackIndex: index,
        desiredColumn: getDesiredColumnFromParents(node.id)
      }))

      desired.sort((a, b) => {
        const aVal =
          a.desiredColumn !== null ? a.desiredColumn : a.fallbackIndex + 100000
        const bVal =
          b.desiredColumn !== null ? b.desiredColumn : b.fallbackIndex + 100000

        if (aVal !== bVal) return aVal - bVal
        return a.fallbackIndex - b.fallbackIndex
      })

      let nextColumn = 0

      desired.forEach((item, index) => {
        if (index === 0) {
          nextColumn =
            item.desiredColumn !== null
              ? Math.max(0, Math.round(item.desiredColumn))
              : 0
        } else {
          const desiredColumn =
            item.desiredColumn !== null
              ? Math.round(item.desiredColumn)
              : nextColumn + 1

          nextColumn = Math.max(nextColumn + 1, desiredColumn)
        }

        columnByNodeId.set(item.node.id, nextColumn)
      })
    }
  }

  const compactColumnsBottomUp = (): void => {
    for (let i = sortedLevels.length - 2; i >= 0; i--) {
      const level = sortedLevels[i]
      const nodes = nodesByLevel.get(level) || []
      if (nodes.length === 0) continue

      const desired = nodes.map((node, index) => ({
        node,
        originalIndex: index,
        desiredColumn: getDesiredColumnFromChildren(node.id)
      }))

      desired.sort((a, b) => {
        const aCurrent = columnByNodeId.get(a.node.id) ?? a.originalIndex
        const bCurrent = columnByNodeId.get(b.node.id) ?? b.originalIndex

        const aVal = a.desiredColumn !== null ? a.desiredColumn : aCurrent
        const bVal = b.desiredColumn !== null ? b.desiredColumn : bCurrent

        if (aVal !== bVal) return aVal - bVal
        return aCurrent - bCurrent
      })

      let previousColumn = -1

      desired.forEach((item) => {
        const current = columnByNodeId.get(item.node.id) ?? 0
        const target =
          item.desiredColumn !== null ? Math.round(item.desiredColumn) : current

        const next = Math.max(previousColumn + 1, target)
        columnByNodeId.set(item.node.id, next)
        previousColumn = next
      })

      nodesByLevel.set(
        level,
        desired.map((item) => item.node)
      )
      rebuildOrderIndex()
    }
  }

  const normalizeAllColumns = (): void => {
    const allColumns = Array.from(columnByNodeId.values())
    if (allColumns.length === 0) return

    const minColumn = Math.min(...allColumns)

    if (minColumn === 0) return

    Array.from(columnByNodeId.entries()).forEach(([nodeId, column]) => {
      columnByNodeId.set(nodeId, column - minColumn)
    })
  }

  const placeNodesOnGrid = (): void => {
    normalizeAllColumns()

    const allColumns = Array.from(columnByNodeId.values())
    const maxColumn = allColumns.length > 0 ? Math.max(...allColumns) : 0

    const contentWidth = maxColumn * GRID_X_STEP
    const centeredLeft =
      containerWidth > 0
        ? Math.max(MIN_LEFT_PADDING, (containerWidth - contentWidth) / 2)
        : MIN_LEFT_PADDING

    sortedLevels.forEach((level) => {
      const nodes = nodesByLevel.get(level) || []
      const y = TOP_PADDING + level * GRID_Y_STEP

      nodes.forEach((node) => {
        const column = columnByNodeId.get(node.id) ?? 0

        nodePositions.set(node.id, {
          x: centeredLeft + column * GRID_X_STEP,
          y:
            containerHeight > 0
              ? Math.min(y, containerHeight - NODE_HEIGHT - TOP_PADDING)
              : y
        })
      })
    })
  }

  reduceCrossings()
  assignRootColumns()
  assignColumnsTopDown()
  compactColumnsBottomUp()
  placeNodesOnGrid()

  return leveledNodes.map((node) => {
    const position = nodePositions.get(node.id) || {
      x: containerWidth / 2,
      y: containerHeight / 2
    }

    return {
      ...node,
      position,
      data: {
        ...node.data
      }
    }
  })
}

export default calculateNodePositions

/* eslint-enable */
