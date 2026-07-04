import { type Node } from 'reactflow'
import {
  type AcyclicGraphVertexViewerProps,
  type VertexData
} from '../acyclic-graph-vertex-viewer'
import { type Vertex } from '../acyclic-graph-viewer'

type AcyclicGraphNode = Node<AcyclicGraphVertexViewerProps<VertexData>>

type GridPosition = {
  x: number
  y: number
}

type BranchGroup = {
  id: string
  centerX: number
  nodes: AcyclicGraphNode[]
  columns: number
  rows: number
  width: number
}

const NODE_WIDTH = 150
const NODE_HEIGHT = 80
const MIN_HORIZONTAL_GAP = 12
const MAX_HORIZONTAL_GAP = 28
const ROOT_VERTICAL_GAP = 12
const BRANCH_HORIZONTAL_GAP = 18
const BRANCH_VERTICAL_GAP = 18
const BRANCH_LEVEL_GAP = 86
const GROUP_GAP = 42
const ROOT_GRID_WIDTH_PART = 0.98
const MAX_BRANCH_COLUMNS = 4

const sortNodeIds = (a: string, b: string): number => {
  const numA = parseInt(a)
  const numB = parseInt(b)
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB
  }
  return a.localeCompare(b)
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

function groupNodesByLevel(nodes: AcyclicGraphNode[]) {
  const nodesByLevel = new Map<number, AcyclicGraphNode[]>()

  nodes.forEach((node) => {
    const level = node.data.level
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, [])
    }
    nodesByLevel.get(level)!.push(node)
  })

  for (const levelNodes of nodesByLevel.values()) {
    levelNodes.sort((a, b) => sortNodeIds(a.id, b.id))
  }

  return nodesByLevel
}

function createVertexMap(vertexes: Vertex[]) {
  return new Map(vertexes.map((vertex) => [vertex.id, vertex]))
}

function createNodeLevelMap(nodesByLevel: Map<number, AcyclicGraphNode[]>) {
  const levelByNodeId = new Map<string, number>()

  for (const [level, nodes] of nodesByLevel.entries()) {
    nodes.forEach((node) => {
      levelByNodeId.set(node.id, level)
    })
  }

  return levelByNodeId
}

function getAdaptiveGap(
  containerSize: number,
  itemSize: number,
  itemsCount: number
) {
  if (itemsCount <= 1) {
    return MIN_HORIZONTAL_GAP
  }

  return clamp(
    (containerSize - itemsCount * itemSize) / Math.max(itemsCount - 1, 1),
    MIN_HORIZONTAL_GAP,
    MAX_HORIZONTAL_GAP
  )
}

function getRootGridColumnCount(itemsCount: number, _availableWidth: number) {
  void _availableWidth
  return Math.max(1, itemsCount)
}

function placeRootGrid(
  nodes: AcyclicGraphNode[],
  availableWidth: number,
  nodePositions: Map<string, GridPosition>
) {
  if (nodes.length === 0) {
    return 0
  }

  const columns = getRootGridColumnCount(nodes.length, availableWidth)
  const rows = Math.ceil(nodes.length / columns)
  const horizontalGap = getAdaptiveGap(availableWidth, NODE_WIDTH, columns)
  const gridWidth = columns * NODE_WIDTH + (columns - 1) * horizontalGap
  const startX = -gridWidth / 2

  nodes.forEach((node, index) => {
    const row = Math.floor(index / columns)
    const column = index % columns
    const rowItemsCount =
      row === rows - 1 ? nodes.length - row * columns : columns
    const rowWidth =
      rowItemsCount * NODE_WIDTH +
      Math.max(0, rowItemsCount - 1) * horizontalGap
    const rowStartX = -rowWidth / 2
    const x =
      row === rows - 1
        ? rowStartX + column * (NODE_WIDTH + horizontalGap)
        : startX + column * (NODE_WIDTH + horizontalGap)

    nodePositions.set(node.id, {
      x,
      y: row * (NODE_HEIGHT + ROOT_VERTICAL_GAP)
    })
  })

  return rows * NODE_HEIGHT + Math.max(0, rows - 1) * ROOT_VERTICAL_GAP
}

function getPrimaryParentId(
  node: AcyclicGraphNode,
  vertexMap: Map<number, Vertex>,
  nodePositions: Map<string, GridPosition>,
  levelByNodeId: Map<string, number>
) {
  const vertex = vertexMap.get(parseInt(node.id, 10))
  if (vertex === undefined) {
    return null
  }

  const parentIds = vertex.parentsIds
    .map((id) => id.toString())
    .filter((id) => nodePositions.has(id))
    .sort((a, b) => {
      const levelA = levelByNodeId.get(a) ?? 0
      const levelB = levelByNodeId.get(b) ?? 0
      if (levelA !== levelB) return levelB - levelA
      return sortNodeIds(a, b)
    })

  return parentIds[0] ?? null
}

function createBranchGroups(
  nodes: AcyclicGraphNode[],
  vertexMap: Map<number, Vertex>,
  nodePositions: Map<string, GridPosition>,
  levelByNodeId: Map<string, number>,
  fallbackCenterX: number
) {
  const nodesByParent = new Map<string, AcyclicGraphNode[]>()

  nodes.forEach((node) => {
    const parentId =
      getPrimaryParentId(node, vertexMap, nodePositions, levelByNodeId) ??
      `unplaced-${node.id}`

    if (!nodesByParent.has(parentId)) {
      nodesByParent.set(parentId, [])
    }
    nodesByParent.get(parentId)!.push(node)
  })

  const groups: BranchGroup[] = []

  for (const [parentId, groupNodes] of nodesByParent.entries()) {
    groupNodes.sort((a, b) => sortNodeIds(a.id, b.id))

    const parentPosition = nodePositions.get(parentId)
    const centerX = parentPosition?.x ?? fallbackCenterX
    const columns = Math.min(
      MAX_BRANCH_COLUMNS,
      groupNodes.length,
      Math.max(1, Math.ceil(Math.sqrt(groupNodes.length)))
    )
    const rows = Math.ceil(groupNodes.length / columns)
    const width = columns * NODE_WIDTH + (columns - 1) * BRANCH_HORIZONTAL_GAP

    groups.push({
      id: parentId,
      centerX,
      nodes: groupNodes,
      columns,
      rows,
      width
    })
  }

  return groups.sort((a, b) => {
    if (a.centerX !== b.centerX) return a.centerX - b.centerX
    return sortNodeIds(a.id, b.id)
  })
}

function separateGroups(groups: BranchGroup[]) {
  if (groups.length === 0) {
    return []
  }

  const placed = groups.map((group) => ({
    group,
    left: group.centerX - group.width / 2,
    right: group.centerX + group.width / 2
  }))

  for (let index = 1; index < placed.length; index++) {
    const minLeft = placed[index - 1].right + GROUP_GAP
    if (placed[index].left < minLeft) {
      const shift = minLeft - placed[index].left
      placed[index].left += shift
      placed[index].right += shift
    }
  }

  for (let index = placed.length - 2; index >= 0; index--) {
    const maxRight = placed[index + 1].left - GROUP_GAP
    if (placed[index].right > maxRight) {
      const shift = placed[index].right - maxRight
      placed[index].left -= shift
      placed[index].right -= shift
    }
  }

  const meanTarget =
    groups.reduce((acc, group) => acc + group.centerX, 0) / groups.length
  const meanPlaced =
    placed.reduce((acc, item) => acc + (item.left + item.right) / 2, 0) /
    placed.length
  const shift = meanTarget - meanPlaced

  return placed.map((item) => ({
    ...item,
    left: item.left + shift,
    right: item.right + shift
  }))
}

function placeBranchLevel(
  nodes: AcyclicGraphNode[],
  startY: number,
  vertexMap: Map<number, Vertex>,
  nodePositions: Map<string, GridPosition>,
  levelByNodeId: Map<string, number>
) {
  const existingPositions = Array.from(nodePositions.values())
  const fallbackCenterX =
    existingPositions.length === 0
      ? 0
      : existingPositions.reduce((acc, position) => acc + position.x, 0) /
        existingPositions.length
  const groups = createBranchGroups(
    nodes,
    vertexMap,
    nodePositions,
    levelByNodeId,
    fallbackCenterX
  )
  const placedGroups = separateGroups(groups)
  let maxRows = 1

  placedGroups.forEach(({ group, left }) => {
    maxRows = Math.max(maxRows, group.rows)

    group.nodes.forEach((node, index) => {
      const row = Math.floor(index / group.columns)
      const column = index % group.columns
      const rowItemsCount =
        row === group.rows - 1
          ? group.nodes.length - row * group.columns
          : group.columns
      const rowWidth =
        rowItemsCount * NODE_WIDTH +
        Math.max(0, rowItemsCount - 1) * BRANCH_HORIZONTAL_GAP
      const rowLeft = left + (group.width - rowWidth) / 2

      nodePositions.set(node.id, {
        x: rowLeft + column * (NODE_WIDTH + BRANCH_HORIZONTAL_GAP),
        y: startY + row * (NODE_HEIGHT + BRANCH_VERTICAL_GAP)
      })
    })
  })

  return (
    startY +
    maxRows * NODE_HEIGHT +
    Math.max(0, maxRows - 1) * BRANCH_VERTICAL_GAP
  )
}

function centerGraph(
  nodePositions: Map<string, GridPosition>,
  containerWidth: number
) {
  const positions = Array.from(nodePositions.values())
  if (positions.length === 0) {
    return nodePositions
  }

  const minX = Math.min(...positions.map((position) => position.x))
  const maxX = Math.max(...positions.map((position) => position.x + NODE_WIDTH))
  const minY = Math.min(...positions.map((position) => position.y))
  const graphWidth = maxX - minX
  const shiftX = containerWidth / 2 - minX - graphWidth / 2
  const shiftY = -minY

  for (const [id, position] of nodePositions.entries()) {
    nodePositions.set(id, {
      x: position.x + shiftX,
      y: position.y + shiftY
    })
  }

  return nodePositions
}

function placeLevels(
  nodesByLevel: Map<number, AcyclicGraphNode[]>,
  vertexMap: Map<number, Vertex>,
  containerWidth: number
) {
  const nodePositions = new Map<string, GridPosition>()
  const levelByNodeId = createNodeLevelMap(nodesByLevel)
  const levels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b)
  const availableWidth = Math.max(
    NODE_WIDTH,
    containerWidth * ROOT_GRID_WIDTH_PART
  )

  const rootLevel = levels[0]
  if (rootLevel === undefined) {
    return nodePositions
  }

  let cursorY = placeRootGrid(
    nodesByLevel.get(rootLevel) ?? [],
    availableWidth,
    nodePositions
  )

  levels.slice(1).forEach((level) => {
    cursorY += BRANCH_LEVEL_GAP
    cursorY = placeBranchLevel(
      nodesByLevel.get(level) ?? [],
      cursorY,
      vertexMap,
      nodePositions,
      levelByNodeId
    )
  })

  return nodePositions
}

const calculateNodePositions = (
  leveledNodes: AcyclicGraphNode[],
  vertexes: Vertex[],
  containerWidth: number,
  _containerHeight: number
): AcyclicGraphNode[] => {
  void _containerHeight

  const nodesByLevel = groupNodesByLevel(leveledNodes)
  const vertexMap = createVertexMap(vertexes)
  const nodePositions = centerGraph(
    placeLevels(nodesByLevel, vertexMap, containerWidth),
    containerWidth
  )

  return leveledNodes.map((node) => ({
    ...node,
    position: nodePositions.get(node.id) ?? { x: 0, y: 0 },
    data: {
      ...node.data
    }
  }))
}

export default calculateNodePositions
