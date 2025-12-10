// export const calculateNodePositions = (
//   leveledNodes: RectangleNode[],
//   containerWidth: number,
//   containerHeight: number,
//   maxLevels: number = 5
// ): RectangleNode[] => {
//   const NODE_WIDTH = 200
//   const NODE_HEIGHT = 100

//   const centerX = containerWidth / 2
//   const centerY = containerHeight / 2

//   const baseRadius = Math.min(containerWidth, containerHeight) * 0.5
//   const radiusStep = Math.min(containerWidth, containerHeight) * 0.15

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

//   for (
//     let level = 1;
//     level <= Math.max(...Array.from(nodesByLevel.keys()));
//     level++
//   ) {
//     const levelNodes = nodesByLevel.get(level) || []
//     if (levelNodes.length === 0) continue

//     const radius = baseRadius + (level - 1) * radiusStep

//     const angleStep = (2 * Math.PI) / levelNodes.length

//     levelNodes.forEach((node, index) => {
//       const angle = index * angleStep

//       const x = centerX + radius * Math.cos(angle)
//       const y = centerY + radius * Math.sin(angle)

//       nodePositions.set(node.id, { x, y })
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

//     groupsByParent.forEach((childNodes, parentId) => {
//       const parentPos = nodePositions.get(parentId)
//       if (!parentPos) return

//       const parentNode = leveledNodes.find((n) => n.id === parentId)
//       if (!parentNode) return

//       const level1Nodes = nodesByLevel.get(1) || []
//       const parentIndex = level1Nodes.findIndex((n) => n.id === parentId)
//       if (parentIndex === -1) return

//       const parentAngle = (2 * Math.PI * parentIndex) / level1Nodes.length

//       const radius = baseRadius * 1.25 + radiusStep

//       const sectorAngle = Math.PI / 3
//       const childAngleStep = sectorAngle / (childNodes.length + 1)

//       childNodes.forEach((childNode, childIndex) => {
//         const angle =
//           parentAngle - sectorAngle / 2 + (childIndex + 1) * childAngleStep

//         const x = centerX + radius * Math.cos(angle)
//         const y = centerY + radius * Math.sin(angle)

//         nodePositions.set(childNode.id, { x, y })
//       })
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
