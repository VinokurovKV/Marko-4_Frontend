// const calculateNodePositions = (
//   leveledNodes: RectangleNode[],
//   containerWidth: number,
//   containerHeight: number,
//   maxLevels: number = 5
// ): RectangleNode[] => {
//   const NODE_WIDTH = 240
//   const NODE_HEIGHT = 120
//   const HORIZONTAL_PADDING = 0 // Общий отступ для всех уровней
//   const VERTICAL_PADDING = 5
//   const VERTICAL_SPACING = 250

//   const centerX = containerWidth / 2
//   const centerY = containerHeight / 2

//   const baseRadius = Math.min(containerWidth, containerHeight) * 0.4

//   const nodePositions = new Map<string, { x: number; y: number }>()

//   const nodesByLevel = new Map<number, RectangleNode[]>()
//   leveledNodes.forEach((node) => {
//     const level = node.data.level
//     if (!nodesByLevel.has(level)) {
//       nodesByLevel.set(level, [])
//     }
//     nodesByLevel.get(level)!.push(node)
//   })

//   // Уровень 0 - корень в центре
//   const rootNodes = nodesByLevel.get(0) || []
//   if (rootNodes.length > 0) {
//     const rootNode = rootNodes[0]
//     nodePositions.set(rootNode.id, { x: centerX, y: centerY })
//   }

//   // Уровень 1 - полуокружность СНИЗУ
//   const level1Nodes = nodesByLevel.get(1) || []

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
//     })
//   }

//   // ОБРАБОТКА ВСЕХ УРОВНЕЙ НАЧИНАЯ С 2-ГО
//   for (
//     let level = 2;
//     level <= Math.max(...Array.from(nodesByLevel.keys()));
//     level++
//   ) {
//     const levelNodes = nodesByLevel.get(level) || []
//     if (levelNodes.length === 0) continue

//     // Группируем по родителям для каждого уровня
//     const groupsByParent = new Map<string, RectangleNode[]>()
//     levelNodes.forEach((node) => {
//       const parentId = node.id.split('.').slice(0, -1).join('.')
//       if (!groupsByParent.has(parentId)) {
//         groupsByParent.set(parentId, [])
//       }
//       groupsByParent.get(parentId)!.push(node)
//     })

//     // Собираем всех детей уровня
//     const allChildren = Array.from(groupsByParent.values()).flat()
//     const sortedAllChildren = allChildren.sort((a, b) =>
//       sortNodeIds(a.id, b.id)
//     )

//     // Вычисляем ширину для уровня
//     const availableWidth = containerWidth - 200
//     const horizontalSpacing = NODE_WIDTH + HORIZONTAL_PADDING
//     const requiredWidth =
//       sortedAllChildren.length * horizontalSpacing - HORIZONTAL_PADDING
//     const actualWidth = Math.max(availableWidth, requiredWidth)

//     const startX = (containerWidth - actualWidth) / 2 + NODE_WIDTH / 2

//     // Вычисляем вертикальную позицию уровня
//     const baseLevelY = centerY + baseRadius + VERTICAL_SPACING
//     const levelY =
//       baseLevelY + (level - 2) * (NODE_HEIGHT * 3 + VERTICAL_SPACING)

//     // Шахматный порядок по 3 уровням высоты
//     sortedAllChildren.forEach((node, index) => {
//       const x = startX + index * horizontalSpacing

//       // Шахматный порядок: 3 уровня высоты
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

//       const y = levelY + yOffset
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
