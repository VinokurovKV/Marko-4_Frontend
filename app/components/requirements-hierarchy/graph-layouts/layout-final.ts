import { type Node } from 'reactflow'
import {
  type AcyclicGraphVertexViewerProps,
  type VertexData
} from '../acyclic-graph-vertex-viewer'
import { type Vertex } from '../acyclic-graph-viewer'

/* eslint-disable */

type AcyclicGraphNode = Node<AcyclicGraphVertexViewerProps<VertexData>>

const sortNodeIds = (a: string, b: string): number => {
  const numA = parseInt(a)
  const numB = parseInt(b)
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB
  }
  return a.localeCompare(b)
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
  const VERTICAL_PADDING = 10
  const LEVEL_OFFSET = 150

  const centerX = containerWidth / 2
  const centerY = containerHeight / 2

  const baseRadius = Math.min(containerWidth, containerHeight) * 1.4

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
  if (rootNodes.length === 1) {
    const rootNode = rootNodes[0]
    nodePositions.set(rootNode.id, { x: centerX, y: centerY })
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
      (endAngle - startAngle) / Math.max(sortedLevel2Nodes.length - 1, 1)

    const level2Y = centerY + 450

    sortedLevel2Nodes.forEach((node, index) => {
      const angle = startAngle + index * angleStep
      const x = centerX + radius * Math.cos(angle)
      const y = level2Y + radius * Math.sin(angle)
      nodePositions.set(node.id, { x, y })
    })
  }

  const level3Nodes = nodesByLevel.get(3) || []
  if (level3Nodes.length > 0) {
    const groupsByParent = new Map<string, AcyclicGraphNode[]>()

    level3Nodes.forEach((node) => {
      const vertexId = parseInt(node.id)
      const vertexInfo = vertexMap.get(vertexId)

      if (vertexInfo && vertexInfo.parentsIds.length > 0) {
        const parentId = vertexInfo.parentsIds[0].toString()
        if (!groupsByParent.has(parentId)) {
          groupsByParent.set(parentId, [])
        }
        groupsByParent.get(parentId)!.push(node)
      } else {
        const orphanKey = `orphan_${node.id}`
        if (!groupsByParent.has(orphanKey)) {
          groupsByParent.set(orphanKey, [])
        }
        groupsByParent.get(orphanKey)!.push(node)
      }
    })

    const parentNodes = level2Nodes

    parentNodes.forEach((parentNode) => {
      const children = groupsByParent.get(parentNode.id) || []
      if (children.length === 0) return

      const sortedChildren = children.sort((a, b) => sortNodeIds(a.id, b.id))
      const parentPos = nodePositions.get(parentNode.id)
      if (!parentPos) return

      const parentVertexId = parseInt(parentNode.id)
      const parentVertexInfo = vertexMap.get(parentVertexId)
      let parentLevel1Id = ''

      if (parentVertexInfo && parentVertexInfo.parentsIds.length > 0) {
        parentLevel1Id = parentVertexInfo.parentsIds[0].toString()
      }

      const parentLevel1Pos = parentLevel1Id
        ? nodePositions.get(parentLevel1Id)
        : null

      let baseX = parentPos.x
      let baseY = parentPos.y + LEVEL_OFFSET

      if (parentLevel1Pos) {
        const dirX = parentPos.x - parentLevel1Pos.x
        const dirY = parentPos.y - parentLevel1Pos.y

        const length = Math.sqrt(dirX * dirX + dirY * dirY)
        if (length > 0) {
          const normX = dirX / length
          const normY = dirY / length

          const offsetDistance = 1000

          baseX = parentPos.x + normX * offsetDistance
          baseY = parentPos.y + normY * offsetDistance
        }
      }

      let direction = 'both'
      if (parentPos.x < centerX - 100) {
        direction = 'left'
      } else if (parentPos.x > centerX + 100) {
        direction = 'right'
      }

      const useTwoRows = sortedChildren.length >= 15
      const itemsPerRow = useTwoRows
        ? Math.ceil(sortedChildren.length / 2)
        : sortedChildren.length

      sortedChildren.forEach((childNode, childIndex) => {
        let x, y

        if (useTwoRows) {
          const row = Math.floor(childIndex / itemsPerRow)
          const col = childIndex % itemsPerRow

          if (direction === 'left') {
            x = baseX - col * (NODE_WIDTH + HORIZONTAL_PADDING)
          } else if (direction === 'right') {
            x = baseX + col * (NODE_WIDTH + HORIZONTAL_PADDING)
          } else {
            const halfRow = Math.floor(itemsPerRow / 2)
            if (col < halfRow) {
              x = baseX - (halfRow - col) * (NODE_WIDTH + HORIZONTAL_PADDING)
            } else {
              x = baseX + (col - halfRow) * (NODE_WIDTH + HORIZONTAL_PADDING)
            }
          }

          y = baseY + row * (NODE_HEIGHT + VERTICAL_PADDING)
        } else {
          if (direction === 'left') {
            x = baseX - childIndex * (NODE_WIDTH + HORIZONTAL_PADDING)
            y = baseY
          } else if (direction === 'right') {
            x = baseX + childIndex * (NODE_WIDTH + HORIZONTAL_PADDING)
            y = baseY
          } else {
            if (childIndex % 2 === 0) {
              x = baseX + (childIndex / 2) * (NODE_WIDTH + HORIZONTAL_PADDING)
            } else {
              x =
                baseX -
                Math.ceil(childIndex / 2) * (NODE_WIDTH + HORIZONTAL_PADDING)
            }
            y = baseY
          }
        }

        nodePositions.set(childNode.id, { x, y })
      })
    })

    for (const [orphanKey, orphanNodes] of groupsByParent) {
      if (orphanKey.startsWith('orphan_')) {
        const sortedOrphans = orphanNodes.sort((a, b) =>
          sortNodeIds(a.id, b.id)
        )
        const totalWidth =
          sortedOrphans.length * (NODE_WIDTH + HORIZONTAL_PADDING) -
          HORIZONTAL_PADDING
        const startX = centerX - totalWidth / 2 + NODE_WIDTH / 2
        const y = centerY + 200 + 3 * LEVEL_OFFSET

        sortedOrphans.forEach((node, index) => {
          const x = startX + index * (NODE_WIDTH + HORIZONTAL_PADDING)
          nodePositions.set(node.id, { x, y })
        })
      }
    }
  }

  for (let level = 4; level <= 5; level++) {
    const levelNodes = nodesByLevel.get(level) || []
    if (levelNodes.length === 0) continue

    const groupsByParent = new Map<string, AcyclicGraphNode[]>()

    levelNodes.forEach((node) => {
      const vertexId = parseInt(node.id)
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
      const levelY = parentPos.y + NODE_HEIGHT + LEVEL_OFFSET

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

/* eslint-enable */
