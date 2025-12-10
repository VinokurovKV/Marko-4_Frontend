// const calculateNodePositions = (
//   leveledNodes: RectangleNode[],
//   containerWidth: number,
//   containerHeight: number,
//   maxLevels: number = 5
// ): RectangleNode[] => {
//   const NODE_WIDTH = 240
//   const NODE_HEIGHT = 120
//   const HORIZONTAL_PADDING = 80
//   const VERTICAL_SPACING = 300

//   const nodesByLevel = new Map<number, RectangleNode[]>()
//   leveledNodes.forEach((node) => {
//     const level = node.data.level
//     if (!nodesByLevel.has(level)) {
//       nodesByLevel.set(level, [])
//     }
//     nodesByLevel.get(level)!.push(node)
//   })

//   const orderedNodesByLevel = new Map<number, RectangleNode[]>()

//   const level0Nodes = nodesByLevel.get(0) || []
//   orderedNodesByLevel.set(0, level0Nodes)

//   for (
//     let level = 1;
//     level <= Math.max(...Array.from(nodesByLevel.keys()));
//     level++
//   ) {
//     const levelNodes = nodesByLevel.get(level) || []
//     if (levelNodes.length === 0) continue

//     const nodesWithBarycenter = levelNodes.map((node) => {
//       const incomingEdges = initialEdges.filter(
//         (edge) => edge.target === node.id
//       )
//       const sourceNodes = incomingEdges
//         .map((edge) => leveledNodes.find((n) => n.id === edge.source))
//         .filter(Boolean) as RectangleNode[]

//       if (sourceNodes.length === 0) {
//         return { node, barycenter: 0 }
//       }

//       const sourcePositions = sourceNodes.map((sourceNode) => {
//         const sourceLevelNodes =
//           orderedNodesByLevel.get(sourceNode.data.level) || []
//         const position = sourceLevelNodes.indexOf(sourceNode)
//         return position !== -1 ? position : 0
//       })

//       const barycenter =
//         sourcePositions.reduce((sum, pos) => sum + pos, 0) /
//         sourcePositions.length
//       return { node, barycenter }
//     })

//     const sortedNodes = nodesWithBarycenter
//       .sort((a, b) => a.barycenter - b.barycenter)
//       .map((item) => item.node)

//     orderedNodesByLevel.set(level, sortedNodes)
//   }

//   const nodePositions = new Map<string, { x: number; y: number }>()
//   let currentY = 80

//   for (
//     let level = 0;
//     level <= Math.max(...Array.from(orderedNodesByLevel.keys()));
//     level++
//   ) {
//     const levelNodes = orderedNodesByLevel.get(level) || []
//     if (levelNodes.length === 0) continue

//     const levelWidth =
//       levelNodes.length * (NODE_WIDTH + HORIZONTAL_PADDING) - HORIZONTAL_PADDING
//     const startX = (containerWidth - levelWidth) / 2 + NODE_WIDTH / 2

//     levelNodes.forEach((node, index) => {
//       const x = startX + index * (NODE_WIDTH + HORIZONTAL_PADDING)
//       const y = currentY
//       nodePositions.set(node.id, { x, y })
//     })

//     currentY += VERTICAL_SPACING
//   }

//   return leveledNodes.map((node) => {
//     const position = nodePositions.get(node.id) || { x: 0, y: 0 }
//     const levelNodes = orderedNodesByLevel.get(node.data.level) || []

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
