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
  const HORIZONTAL_PADDING = 40
  const VERTICAL_SPACING = 200
  const LEVEL_VERTICAL_PADDING = 80
  const SWEEP_ITERATIONS = 4

  const nodePositions = new Map<string, { x: number; y: number }>()

  const vertexMap = new Map<number, Vertex>()
  vertexes.forEach((vertex) => {
    vertexMap.set(vertex.id, vertex)
  })

  const nodeMap = new Map<string, AcyclicGraphNode>()
  leveledNodes.forEach((node) => {
    nodeMap.set(node.id, node)
  })

  const nodesByLevel = new Map<number, AcyclicGraphNode[]>()

  leveledNodes.forEach((node) => {
    const level = node.data.level
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, [])
    }
    nodesByLevel.get(level)!.push(node)
  })

  const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b)

  const parentIdsMap = new Map<string, string[]>()
  const childrenIdsMap = new Map<string, string[]>()

  leveledNodes.forEach((node) => {
    parentIdsMap.set(node.id, [])
    childrenIdsMap.set(node.id, [])
  })

  vertexes.forEach((vertex) => {
    const currentId = vertex.id.toString()
    const parentIds = vertex.parentsIds.map((id) => id.toString())

    parentIdsMap.set(currentId, parentIds)

    parentIds.forEach((parentId) => {
      if (!childrenIdsMap.has(parentId)) {
        childrenIdsMap.set(parentId, [])
      }
      childrenIdsMap.get(parentId)!.push(currentId)
    })
  })

  const orderIndexByLevel = new Map<number, Map<string, number>>()

  const rebuildOrderIndex = (): void => {
    orderIndexByLevel.clear()

    sortedLevels.forEach((level) => {
      const nodes = nodesByLevel.get(level) || []
      const orderMap = new Map<string, number>()

      nodes.forEach((node, index) => {
        orderMap.set(node.id, index)
      })

      orderIndexByLevel.set(level, orderMap)
    })
  }

  const getNeighborOrderAverage = (
    nodeId: string,
    neighborLevel: number,
    direction: 'parents' | 'children'
  ): number => {
    const neighborOrderMap = orderIndexByLevel.get(neighborLevel)
    if (!neighborOrderMap) return Number.POSITIVE_INFINITY

    const neighborIds =
      direction === 'parents'
        ? parentIdsMap.get(nodeId) || []
        : childrenIdsMap.get(nodeId) || []

    const validOrders = neighborIds
      .map((id) => neighborOrderMap.get(id))
      .filter((value): value is number => value !== undefined)

    if (validOrders.length === 0) {
      return Number.POSITIVE_INFINITY
    }

    const sum = validOrders.reduce((acc, value) => acc + value, 0)
    return sum / validOrders.length
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
      barycenter: getNeighborOrderAverage(node.id, referenceLevel, neighborType)
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

  const initializeLevelOrder = (): void => {
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

  const reduceCrossings = (): void => {
    initializeLevelOrder()

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

  const getIdealX = (nodeId: string, level: number): number | null => {
    const parentIds = parentIdsMap.get(nodeId) || []

    const parentPositions = parentIds
      .map((parentId) => nodePositions.get(parentId))
      .filter((pos): pos is { x: number; y: number } => pos !== undefined)

    if (parentPositions.length > 0) {
      const avgX =
        parentPositions.reduce((acc, pos) => acc + pos.x, 0) /
        parentPositions.length
      return avgX
    }

    if (level > 0) {
      const upperLevelNodes = nodesByLevel.get(level - 1) || []
      const upperLevelPositions = upperLevelNodes
        .map((node) => nodePositions.get(node.id))
        .filter((pos): pos is { x: number; y: number } => pos !== undefined)

      if (upperLevelPositions.length > 0) {
        const avgX =
          upperLevelPositions.reduce((acc, pos) => acc + pos.x, 0) /
          upperLevelPositions.length
        return avgX
      }
    }

    return null
  }

  const layoutRootLevel = (): void => {
    const rootLevel = sortedLevels[0]
    const rootNodes = nodesByLevel.get(rootLevel) || []
    if (rootNodes.length === 0) return

    const totalWidth =
      rootNodes.length * NODE_WIDTH +
      (rootNodes.length - 1) * HORIZONTAL_PADDING

    const startLeft = (containerWidth - totalWidth) / 2
    const y = LEVEL_VERTICAL_PADDING

    rootNodes.forEach((node, index) => {
      const x =
        startLeft + NODE_WIDTH / 2 + index * (NODE_WIDTH + HORIZONTAL_PADDING)
      nodePositions.set(node.id, { x, y })
    })
  }

  const placeLevel = (level: number): void => {
    const levelNodes = nodesByLevel.get(level) || []
    if (levelNodes.length === 0) return

    const y = LEVEL_VERTICAL_PADDING + level * VERTICAL_SPACING
    const minCenterDistance = NODE_WIDTH + HORIZONTAL_PADDING

    const desiredCenters = levelNodes.map((node, index) => {
      const idealX = getIdealX(node.id, level)
      return {
        node,
        idealX:
          idealX ??
          containerWidth / 2 +
            (index - (levelNodes.length - 1) / 2) * minCenterDistance
      }
    })

    const placed: Array<{ node: AcyclicGraphNode; x: number }> = []

    desiredCenters.forEach((item, index) => {
      let x = item.idealX

      if (index > 0) {
        const prev = placed[index - 1]
        x = Math.max(x, prev.x + minCenterDistance)
      }

      placed.push({
        node: item.node,
        x
      })
    })

    for (let i = placed.length - 2; i >= 0; i--) {
      const current = placed[i]
      const next = placed[i + 1]
      const maxAllowedX = next.x - minCenterDistance

      if (current.x > maxAllowedX) {
        current.x = maxAllowedX
      }
    }

    const leftEdge = placed[0].x - NODE_WIDTH / 2
    const rightEdge = placed[placed.length - 1].x + NODE_WIDTH / 2

    let shift = 0

    if (leftEdge < 0) {
      shift = -leftEdge + HORIZONTAL_PADDING
    } else if (rightEdge > containerWidth) {
      shift = containerWidth - rightEdge - HORIZONTAL_PADDING
    }

    placed.forEach((item) => {
      nodePositions.set(item.node.id, {
        x: item.x + shift,
        y
      })
    })
  }

  const applyVerticalBounds = (): void => {
    const maxY =
      containerHeight > 0
        ? Math.max(LEVEL_VERTICAL_PADDING, containerHeight - NODE_HEIGHT)
        : Number.POSITIVE_INFINITY

    leveledNodes.forEach((node) => {
      const pos = nodePositions.get(node.id)
      if (!pos) return

      nodePositions.set(node.id, {
        x: pos.x,
        y: Math.min(pos.y, maxY)
      })
    })
  }

  reduceCrossings()
  layoutRootLevel()

  for (let i = 1; i < sortedLevels.length; i++) {
    placeLevel(sortedLevels[i])
  }

  applyVerticalBounds()

  return leveledNodes.map((node) => {
    const position = nodePositions.get(node.id) || { x: 0, y: 0 }

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
