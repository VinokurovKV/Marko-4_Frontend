import { type Node } from 'reactflow'
import {
  type AcyclicGraphVertexViewerProps,
  type VertexData
} from '../acyclic-graph-vertex-viewer'
import { type Vertex } from '../acyclic-graph-viewer'

type AcyclicGraphNode = Node<AcyclicGraphVertexViewerProps<VertexData>>

const sortNodeIds = (a: string, b: string): number => {
  const numA = parseInt(a)
  const numB = parseInt(b)
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB
  }
  return a.localeCompare(b)
}

function placeBandNodes(
  items: Array<{ id: string; targetX: number }>,
  minStep: number,
  viewportCenterX?: number
): Array<{ id: string; x: number }> {
  if (items.length === 0) {
    return []
  }
  const sorted = [...items].sort((a, b) => {
    if (a.targetX !== b.targetX) return a.targetX - b.targetX
    return sortNodeIds(a.id, b.id)
  })

  const placed = sorted.map((item, index) => ({
    id: item.id,
    x: index === 0 ? item.targetX : 0
  }))

  for (let i = 1; i < placed.length; i++) {
    placed[i].x = Math.max(sorted[i].targetX, placed[i - 1].x + minStep)
  }

  for (let i = placed.length - 2; i >= 0; i--) {
    placed[i].x = Math.min(placed[i].x, placed[i + 1].x - minStep)
  }

  // Recenter the whole band to avoid one-sided drift:
  // 1) toward parents' mean target X
  // 2) slightly toward viewport center.
  const meanTargetX =
    sorted.reduce((acc, item) => acc + item.targetX, 0) / sorted.length
  const meanPlacedX =
    placed.reduce((acc, item) => acc + item.x, 0) / placed.length
  let shift = meanTargetX - meanPlacedX

  if (viewportCenterX !== undefined) {
    const minX = placed[0].x
    const maxX = placed[placed.length - 1].x
    const bandCenterX = (minX + maxX) / 2
    const centerShift = (viewportCenterX - bandCenterX) * 0.35
    shift += centerShift
  }

  for (const item of placed) {
    item.x += shift
  }

  return placed
}

const calculateNodePositions = (
  leveledNodes: AcyclicGraphNode[],
  vertexes: Vertex[],
  containerWidth: number,
  containerHeight: number
): AcyclicGraphNode[] => {
  const NODE_WIDTH = 240
  const NODE_HEIGHT = 120
  const HORIZONTAL_PADDING = 20
  const LEVEL_OFFSET = 150
  const LEVEL2_VERTICAL_OFFSET = 260
  const LEVEL2_COLUMN_STEP = NODE_WIDTH + HORIZONTAL_PADDING
  const LEVEL3_VERTICAL_OFFSET = 210
  const LEVEL3_COLUMN_STEP = NODE_WIDTH + 10

  const centerX = containerWidth / 2
  const centerY = containerHeight / 2

  const nodePositions = new Map<string, { x: number; y: number }>()

  const vertexMap = new Map<number, Vertex>()
  vertexes.forEach((v) => vertexMap.set(v.id, v))

  const nodesByLevel = new Map<number, AcyclicGraphNode[]>()
  leveledNodes.forEach((node) => {
    const level = node.data.level
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, [])
    }
    nodesByLevel.get(level)!.push(node)
  })

  const rootNodes = nodesByLevel.get(0) || []
  let rootMinX = centerX
  let rootMaxX = centerX
  let rootMeanY = centerY
  if (rootNodes.length === 1) {
    const rootNode = rootNodes[0]
    nodePositions.set(rootNode.id, { x: centerX, y: centerY })
    rootMinX = centerX
    rootMaxX = centerX
    rootMeanY = centerY
  } else if (rootNodes.length > 1) {
    const sortedRoots = rootNodes.sort((a, b) => sortNodeIds(a.id, b.id))
    const totalWidth =
      sortedRoots.length * (NODE_WIDTH + HORIZONTAL_PADDING) -
      HORIZONTAL_PADDING
    const startX = centerX - totalWidth / 2 + NODE_WIDTH / 2
    const y = Math.max(100, centerY / 3)

    sortedRoots.forEach((node, index) => {
      const x = startX + index * (NODE_WIDTH + HORIZONTAL_PADDING)
      nodePositions.set(node.id, { x, y })
    })
    const rootXs = sortedRoots.map((node, index) => {
      return startX + index * (NODE_WIDTH + HORIZONTAL_PADDING)
    })
    rootMinX = Math.min(...rootXs)
    rootMaxX = Math.max(...rootXs)
    rootMeanY = y
  }
  const sectorCenterY = rootMeanY

  const level1Nodes = nodesByLevel.get(1) || []
  let level1CircleRadius = 0
  let level1CircleCenterY = rootMeanY
  if (level1Nodes.length > 0) {
    const sortedLevel1Nodes = level1Nodes.sort((a, b) =>
      sortNodeIds(a.id, b.id)
    )
    // Semiradial-style placement:
    // level 1 is placed on a semicircle around level 0,
    // with radius equal to the visual width of level 0.
    const rootLevelWidth = Math.max(
      NODE_WIDTH,
      rootMaxX - rootMinX + NODE_WIDTH
    )
    const radius = rootLevelWidth / 2 + NODE_WIDTH
    const arcCenterY = rootMeanY
    level1CircleRadius = radius
    level1CircleCenterY = arcCenterY

    const startAngle = -Math.PI / 2
    const fullCircle = Math.PI * 2
    const angleStep = fullCircle / Math.max(sortedLevel1Nodes.length, 1)

    sortedLevel1Nodes.forEach((node, index) => {
      const angle = startAngle + index * angleStep
      const x = centerX + radius * Math.cos(angle)
      const y = arcCenterY + radius * Math.sin(angle)
      nodePositions.set(node.id, { x, y })
    })
  }

  const level2Nodes = nodesByLevel.get(2) || []
  if (level2Nodes.length > 0) {
    const upperBandNodes: Array<{ id: string; targetX: number }> = []
    const lowerBandNodes: Array<{ id: string; targetX: number }> = []

    level2Nodes.forEach((node) => {
      const vertexId = parseInt(node.id, 10)
      const ownerLevel1Id = vertexMap.get(vertexId)?.parentsIds?.[0]
      if (ownerLevel1Id === undefined) return
      const ownerPos = nodePositions.get(ownerLevel1Id.toString())
      if (ownerPos === undefined) return
      if (ownerPos.y < sectorCenterY) {
        upperBandNodes.push({
          id: node.id,
          targetX: ownerPos.x
        })
      } else {
        lowerBandNodes.push({
          id: node.id,
          targetX: ownerPos.x
        })
      }
    })

    const upperPlaced = placeBandNodes(
      upperBandNodes,
      LEVEL2_COLUMN_STEP,
      centerX
    )
    const lowerPlaced = placeBandNodes(
      lowerBandNodes,
      LEVEL2_COLUMN_STEP,
      centerX
    )

    if (upperPlaced.length > 0) {
      const y =
        level1CircleCenterY - level1CircleRadius - LEVEL2_VERTICAL_OFFSET
      upperPlaced.forEach((item) => {
        nodePositions.set(item.id, {
          x: item.x,
          y
        })
      })
    }

    if (lowerPlaced.length > 0) {
      const y =
        level1CircleCenterY + level1CircleRadius + LEVEL2_VERTICAL_OFFSET
      lowerPlaced.forEach((item) => {
        nodePositions.set(item.id, {
          x: item.x,
          y
        })
      })
    }
  }

  const level3Nodes = nodesByLevel.get(3) || []
  if (level3Nodes.length > 0) {
    const upperBandNodes: Array<{ id: string; targetX: number }> = []
    const lowerBandNodes: Array<{ id: string; targetX: number }> = []

    level3Nodes.forEach((node) => {
      const vertexId = parseInt(node.id, 10)
      const parentLevel2Id = vertexMap.get(vertexId)?.parentsIds?.[0]
      if (parentLevel2Id === undefined) return
      const ownerLevel1Id = vertexMap.get(parentLevel2Id)?.parentsIds?.[0]
      if (ownerLevel1Id === undefined) return
      const ownerPos = nodePositions.get(ownerLevel1Id.toString())
      const parentLevel2Pos = nodePositions.get(parentLevel2Id.toString())
      if (ownerPos === undefined) return
      const targetX = parentLevel2Pos?.x ?? ownerPos.x
      if (ownerPos.y < sectorCenterY) {
        upperBandNodes.push({
          id: node.id,
          targetX
        })
      } else {
        lowerBandNodes.push({
          id: node.id,
          targetX
        })
      }
    })

    const upperPlaced = placeBandNodes(
      upperBandNodes,
      LEVEL3_COLUMN_STEP,
      centerX
    )
    const lowerPlaced = placeBandNodes(
      lowerBandNodes,
      LEVEL3_COLUMN_STEP,
      centerX
    )

    if (upperPlaced.length > 0) {
      const y =
        level1CircleCenterY -
        level1CircleRadius -
        LEVEL2_VERTICAL_OFFSET -
        LEVEL3_VERTICAL_OFFSET
      upperPlaced.forEach((item) => {
        nodePositions.set(item.id, {
          x: item.x,
          y
        })
      })
    }

    if (lowerPlaced.length > 0) {
      const y =
        level1CircleCenterY +
        level1CircleRadius +
        LEVEL2_VERTICAL_OFFSET +
        LEVEL3_VERTICAL_OFFSET
      lowerPlaced.forEach((item) => {
        nodePositions.set(item.id, {
          x: item.x,
          y
        })
      })
    }
  }

  for (let level = 4; level <= 5; level++) {
    const levelNodes = nodesByLevel.get(level) || []
    if (levelNodes.length === 0) continue

    const groupsByParent = new Map<string, AcyclicGraphNode[]>()

    levelNodes.forEach((node) => {
      const vertexId = parseInt(node.id, 10)
      const vertexInfo = vertexMap.get(vertexId)

      if (vertexInfo && vertexInfo.parentsIds.length > 0) {
        const parentId = vertexInfo.parentsIds[0].toString()
        if (!groupsByParent.has(parentId)) {
          groupsByParent.set(parentId, [])
        }
        groupsByParent.get(parentId)!.push(node)
      }
    })

    const parentNodes = nodesByLevel.get(level - 1) || []
    parentNodes.forEach((parentNode) => {
      const children = groupsByParent.get(parentNode.id) || []
      if (children.length === 0) return

      const sortedChildren = children.sort((a, b) => sortNodeIds(a.id, b.id))
      const parentPos = nodePositions.get(parentNode.id)

      if (!parentPos) return

      const startX =
        parentPos.x -
        ((sortedChildren.length - 1) * (NODE_WIDTH + HORIZONTAL_PADDING)) / 2
      const goesUp = parentPos.y < sectorCenterY
      const levelY = goesUp
        ? parentPos.y - (NODE_HEIGHT + LEVEL_OFFSET)
        : parentPos.y + NODE_HEIGHT + LEVEL_OFFSET

      sortedChildren.forEach((childNode, index) => {
        const x = startX + index * (NODE_WIDTH + HORIZONTAL_PADDING)
        const y = levelY
        nodePositions.set(childNode.id, { x, y })
      })
    })

    const placedNodes = new Set(Array.from(nodePositions.keys()))
    const unplacedNodes = levelNodes.filter((node) => !placedNodes.has(node.id))

    if (unplacedNodes.length > 0) {
      const sortedUnplaced = unplacedNodes.sort((a, b) =>
        sortNodeIds(a.id, b.id)
      )
      const totalWidth =
        sortedUnplaced.length * (NODE_WIDTH + HORIZONTAL_PADDING) -
        HORIZONTAL_PADDING
      const startX = centerX - totalWidth / 2 + NODE_WIDTH / 2
      const levelY = centerY + 200 + (level - 1) * LEVEL_OFFSET

      sortedUnplaced.forEach((node, index) => {
        const x = startX + index * (NODE_WIDTH + HORIZONTAL_PADDING)
        const y = levelY
        nodePositions.set(node.id, { x, y })
      })
    }
  }

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
