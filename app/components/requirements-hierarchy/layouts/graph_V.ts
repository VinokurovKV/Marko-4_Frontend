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
      (sortedAllChildren.length * horizontalSpacing - HORIZONTAL_PADDING) / 2
    const actualWidth = Math.max(availableWidth, requiredWidth)

    const startX = (containerWidth - actualWidth / 2) / 2 + NODE_WIDTH / 2

    const baseLevelY = centerY + baseRadius + VERTICAL_SPACING
    const levelY =
      baseLevelY + (level - 3) * (NODE_HEIGHT * 30 + VERTICAL_SPACING)

    let loopCount = 0

    sortedAllChildren.forEach((node, index) => {
      let x
      const heightLevel = index % 30
      if (heightLevel == 0) {
        loopCount--
      }
      if (heightLevel <= 14) {
        x = startX + loopCount * 3900 + index * horizontalSpacing
      } else {
        x =
          startX +
          loopCount * 3900 +
          (index - (index % 15) * 2) * horizontalSpacing
      }

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
