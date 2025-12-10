// const sortNodeIds = (a: string, b: string): number => {
//   const partsA = a.split('.').map(Number)
//   const partsB = b.split('.').map(Number)

//   for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
//     const numA = partsA[i] || 0
//     const numB = partsB[i] || 0
//     if (numA !== numB) {
//       return numA - numB
//     }
//   }
//   return 0
// }

// const calculateNodePositions = (
//   leveledNodes: RectangleNode[],
//   containerWidth: number,
//   containerHeight: number,
//   maxLevels: number = 5
// ): RectangleNode[] => {
//   const NODE_WIDTH = 240
//   const NODE_HEIGHT = 120
//   const HORIZONTAL_PADDING_LEVEL2 = 0
//   const VERTICAL_PADDING = 5
//   const VERTICAL_SPACING = 250

//   const centerX = containerWidth / 2
//   const centerY = containerHeight / 2

//   const baseRadius = Math.min(containerWidth, containerHeight) * 1.5

//   const nodePositions = new Map<string, { x: number; y: number }>()

//   const nodesByLevel = new Map<number, RectangleNode[]>()
//   leveledNodes.forEach((node) => {
//     const level = node.data.level
//     if (!nodesByLevel.has(level)) {
//       nodesByLevel.set(level, [])
//     }
//     nodesByLevel.get(level)!.push(node)
//   })

//   const rootNodes = nodesByLevel.get(0) || []
//   if (rootNodes.length > 0) {
//     const rootNode = rootNodes[0]
//     nodePositions.set(rootNode.id, { x: centerX, y: centerY })
//   }

//   const level1Nodes = nodesByLevel.get(1) || []
//   const level1LinearPositions = new Map<string, number>()

//   if (level1Nodes.length > 0) {
//     const sortedLevel1Nodes = level1Nodes.sort((a, b) =>
//       sortNodeIds(a.id, b.id)
//     )
//     const radius = baseRadius

//     const startAngle = Math.PI
//     const endAngle = 0
//     const angleStep =
//       (endAngle - startAngle) / (sortedLevel1Nodes.length - 1 || 1)

//     sortedLevel1Nodes.forEach((node, index) => {
//       const angle = startAngle + index * angleStep

//       const x = centerX + radius * Math.cos(angle)
//       const y = centerY + radius * Math.sin(angle)
//       nodePositions.set(node.id, { x, y })

//       const semicircleLength = Math.PI * radius
//       const linearPos = (index / sortedLevel1Nodes.length) * semicircleLength
//       level1LinearPositions.set(node.id, linearPos)
//     })
//   }

//   const level2Nodes = nodesByLevel.get(2) || []
//   if (level2Nodes.length > 0) {
//     const groupsByParent = new Map<string, RectangleNode[]>()
//     level2Nodes.forEach((node) => {
//       const parentId = node.id.split('.').slice(0, -1).join('.')
//       if (!groupsByParent.has(parentId)) {
//         groupsByParent.set(parentId, [])
//       }
//       groupsByParent.get(parentId)!.push(node)
//     })

//     const allChildren = Array.from(groupsByParent.values()).flat()
//     const sortedAllChildren = allChildren.sort((a, b) =>
//       sortNodeIds(a.id, b.id)
//     )

//     const availableWidth = containerWidth - 200
//     const horizontalSpacingLevel2 = NODE_WIDTH + HORIZONTAL_PADDING_LEVEL2
//     const requiredWidthLevel2 =
//       sortedAllChildren.length * horizontalSpacingLevel2 -
//       HORIZONTAL_PADDING_LEVEL2
//     const actualWidthLevel2 = Math.max(availableWidth, requiredWidthLevel2)

//     const startX = (containerWidth - actualWidthLevel2) / 2 + NODE_WIDTH / 2
//     const level2Y = centerY + baseRadius + VERTICAL_SPACING

//     sortedAllChildren.forEach((node, index) => {
//       const x = startX + index * horizontalSpacingLevel2

//       const heightLevel = index % 3
//       let yOffset = 0

//       switch (heightLevel) {
//         case 0:
//           yOffset = 0
//           break
//         case 1:
//           yOffset = NODE_HEIGHT + VERTICAL_PADDING
//           break
//         case 2:
//           yOffset = (NODE_HEIGHT + VERTICAL_PADDING) * 2
//           break
//       }

//       const y = level2Y + yOffset
//       nodePositions.set(node.id, { x, y })
//     })
//   }

//   return leveledNodes.map((node) => {
//     const position = nodePositions.get(node.id) || { x: 0, y: 0 }
//     const levelNodes = nodesByLevel.get(node.data.level) || []

//     return {
//       ...node,
//       position,
//       data: {
//         ...node.data,
//         nodesInLevel: levelNodes.length,
//         width: NODE_WIDTH,
//         height: NODE_HEIGHT
//       }
//     }
//   })
// }
