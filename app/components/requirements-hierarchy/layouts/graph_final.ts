import { type RectangleNode } from '../TechSpec/nodes'

/* eslint-disable */

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
  const VERTICAL_PADDING = 10
  const LEVEL_OFFSET = 150

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

  const level3Nodes = nodesByLevel.get(3) || []
  if (level3Nodes.length > 0) {
    const groupsByParent = new Map<string, RectangleNode[]>()
    level3Nodes.forEach((node) => {
      const parentId = node.id.split('.').slice(0, -1).join('.')
      if (!groupsByParent.has(parentId)) {
        groupsByParent.set(parentId, [])
      }
      groupsByParent.get(parentId)!.push(node)
    })

    const parentNodes = nodesByLevel.get(2) || []

    parentNodes.forEach((parentNode) => {
      const children = groupsByParent.get(parentNode.id) || []
      if (children.length === 0) return

      const sortedChildren = children.sort((a, b) => sortNodeIds(a.id, b.id))

      const parentLevel2Pos = nodePositions.get(parentNode.id)
      if (!parentLevel2Pos) return

      const parentLevel1Id = parentNode.id.split('.').slice(0, -1).join('.')
      const parentLevel1Pos = nodePositions.get(parentLevel1Id)
      if (!parentLevel1Pos) return

      const dirX = parentLevel2Pos.x - parentLevel1Pos.x
      const dirY = parentLevel2Pos.y - parentLevel1Pos.y

      const length = Math.sqrt(dirX * dirX + dirY * dirY)
      const normX = dirX / length
      const normY = dirY / length

      const offsetDistance = 1000

      const baseX = parentLevel2Pos.x + normX * offsetDistance
      const baseY = parentLevel2Pos.y + normY * offsetDistance

      const parentLevel1Number = parseInt(parentLevel1Id.split('.')[1])
      let direction = 'both'

      if (parentLevel1Number === 16) {
        direction = 'left'
      } else if (parentLevel1Number === 18) {
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
  }

  const level4Nodes = nodesByLevel.get(4) || []
  if (level4Nodes.length > 0) {
    const groupsByParent = new Map<string, RectangleNode[]>()
    level4Nodes.forEach((node) => {
      const parentId = node.id.split('.').slice(0, -1).join('.')
      if (!groupsByParent.has(parentId)) {
        groupsByParent.set(parentId, [])
      }
      groupsByParent.get(parentId)!.push(node)
    })

    groupsByParent.forEach((children, parentId) => {
      const sortedChildren = children.sort((a, b) => sortNodeIds(a.id, b.id))
      const parentPos = nodePositions.get(parentId)

      if (!parentPos) return

      const startX =
        parentPos.x -
        ((sortedChildren.length - 1) * (NODE_WIDTH + HORIZONTAL_PADDING)) / 2
      const level4Y = parentPos.y + NODE_HEIGHT + LEVEL_OFFSET

      sortedChildren.forEach((childNode, index) => {
        const x = startX + index * (NODE_WIDTH + HORIZONTAL_PADDING * 2)
        const y = level4Y
        nodePositions.set(childNode.id, { x, y })
      })
    })
  }

  const level5Nodes = nodesByLevel.get(5) || []
  if (level5Nodes.length > 0) {
    const groupsByParent = new Map<string, RectangleNode[]>()
    level5Nodes.forEach((node) => {
      const parentId = node.id.split('.').slice(0, -1).join('.')
      if (!groupsByParent.has(parentId)) {
        groupsByParent.set(parentId, [])
      }
      groupsByParent.get(parentId)!.push(node)
    })

    groupsByParent.forEach((children, parentId) => {
      const sortedChildren = children.sort((a, b) => sortNodeIds(a.id, b.id))
      const parentPos = nodePositions.get(parentId)

      if (!parentPos) return

      const level5X = parentPos.x
      const startY = parentPos.y + NODE_HEIGHT + LEVEL_OFFSET

      sortedChildren.forEach((childNode, index) => {
        const x = level5X
        const y = startY + index * (NODE_HEIGHT + VERTICAL_PADDING)
        nodePositions.set(childNode.id, { x, y })
      })
    })
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

export default calculateNodePositions

/* eslint-enable */
