// const calculateNodePositions = (
//   leveledNodes: RectangleNode[],
//   containerWidth: number,
//   containerHeight: number,
//   maxLevels: number = 5
// ): RectangleNode[] => {
//   const NODE_WIDTH = 200
//   const NODE_HEIGHT = 100

//   const centerX = containerWidth / 2
//   const centerY = containerHeight / 2

//   const baseRadius = Math.min(containerWidth, containerHeight) * 0.8
//   const radiusStep = Math.min(containerWidth, containerHeight) * 0.3

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
//   if (level1Nodes.length > 0) {
//     const radius = baseRadius

//     const startAngle = 0
//     const endAngle = Math.PI
//     const angleStep = (endAngle - startAngle) / (level1Nodes.length - 1 || 1)

//     level1Nodes.forEach((node, index) => {
//       const angle = startAngle + index * angleStep

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

//       const dx = parentPos.x - centerX
//       const dy = parentPos.y - centerY
//       let parentAngle = Math.atan2(dy, dx)

//       if (parentAngle < 0) {
//         parentAngle += 2 * Math.PI
//       }
//       if (parentAngle > Math.PI) {
//         parentAngle = Math.PI - (parentAngle - Math.PI)
//       }

//       const radius = baseRadius * 2 + radiusStep

//       const sectorAngle = Math.PI / 4
//       let startAngle = parentAngle - sectorAngle / 2
//       let endAngle = parentAngle + sectorAngle / 2

//       startAngle = Math.max(0, startAngle)
//       endAngle = Math.min(Math.PI, endAngle)

//       const childAngleStep =
//         (endAngle - startAngle) / (childNodes.length - 1 || 1)

//       childNodes.forEach((childNode, childIndex) => {
//         const angle = startAngle + childIndex * childAngleStep

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
