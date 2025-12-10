// export const calculateNodePositions = (
//   leveledNodes: RectangleNode[],
//   containerWidth: number,
//   containerHeight: number,
//   maxLevels: number = 5
// ): RectangleNode[] => {
//   const nodesByLevel: Map<number, RectangleNode[]> = new Map()

//   leveledNodes.forEach((node) => {
//     const level = Math.min(node.data.level, maxLevels - 1)
//     if (!nodesByLevel.has(level)) {
//       nodesByLevel.set(level, [])
//     }
//     nodesByLevel.get(level)!.push(node)
//   })

//   const actualLevels = Math.min(
//     Math.max(...Array.from(nodesByLevel.keys())) + 1,
//     maxLevels
//   )

//   const NODE_WIDTH = 240
//   const NODE_HEIGHT = 120
//   const HORIZONTAL_PADDING = 20
//   const VERTICAL_PADDING = 30
//   const VERTICAL_SPACING = {
//     0: 150,
//     1: 450,
//     2: 900,
//     3: 1350,
//     default: 300
//   }

//   const nodePositions = new Map<string, { x: number; y: number }>()

//   const level0Nodes = nodesByLevel.get(0) || []
//   if (level0Nodes.length > 0) {
//     const level0Node = level0Nodes[0]
//     nodePositions.set(level0Node.id, { x: containerWidth / 2, y: 80 })
//   }

//   const level1Nodes = nodesByLevel.get(1) || []
//   const level1Positions = new Map<string, number>()
//   let level1Left = 0
//   let level1Right = 0

//   if (level1Nodes.length > 0) {
//     const sortedLevel1Nodes = level1Nodes.sort((a, b) =>
//       sortNodeIds(a.id, b.id)
//     )

//     const level1Width =
//       sortedLevel1Nodes.length * (NODE_WIDTH + HORIZONTAL_PADDING) -
//       HORIZONTAL_PADDING
//     const startX = (containerWidth - level1Width) / 2 + NODE_WIDTH / 2
//     const baseY = 80 + VERTICAL_SPACING[1]

//     sortedLevel1Nodes.forEach((node, index) => {
//       const x = startX + index * (NODE_WIDTH + HORIZONTAL_PADDING)

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

//       const y = baseY + yOffset
//       nodePositions.set(node.id, { x, y })
//       level1Positions.set(node.id, x)

//       if (index === 0) level1Left = x
//       if (index === sortedLevel1Nodes.length - 1) level1Right = x
//     })
//   }

//   let currentY = 80 + VERTICAL_SPACING[1] + VERTICAL_SPACING[2] + NODE_HEIGHT

//   const groups: Map<string, RectangleNode[]> = new Map()
//   const level2Nodes = nodesByLevel.get(2) || []
//   level2Nodes.forEach((node) => {
//     const parts = node.id.split('.')
//     const parentId = parts.slice(0, -1).join('.')

//     if (!groups.has(parentId)) {
//       groups.set(parentId, [])
//     }
//     groups.get(parentId)!.push(node)
//   })

//   const allChildren = Array.from(groups.values()).flat()
//   const sortedAllChildren = allChildren.sort((a, b) => sortNodeIds(a.id, b.id))

//   if (sortedAllChildren.length > 0) {
//     const HORIZONTAL_PADDING_LEVEL2 = 10

//     const availableWidth = level1Right - level1Left
//     const horizontalSpacingLevel2 = NODE_WIDTH + HORIZONTAL_PADDING_LEVEL2
//     const requiredWidthLevel2 =
//       sortedAllChildren.length * horizontalSpacingLevel2 -
//       HORIZONTAL_PADDING_LEVEL2
//     const actualWidthLevel2 = Math.max(availableWidth, requiredWidthLevel2)

//     const startX = level1Left + (availableWidth - actualWidthLevel2) / 2

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

//       const y = currentY + yOffset
//       nodePositions.set(node.id, { x, y })
//     })

//     currentY +=
//       NODE_HEIGHT * 3 + VERTICAL_PADDING * 2 + VERTICAL_SPACING.default
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
