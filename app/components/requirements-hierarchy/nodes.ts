import { type Node } from 'reactflow'
import 'reactflow/dist/style.css'
import { type RectangleProps } from './rectangle'

/* eslint-disable */

export type RectangleNode = Node<RectangleProps>

const defaultPosition = {
  x: 0,
  y: 0
}

const defaultNodesInLevel = 0
const defaultWidth = 0
const defaultHeight = 0

const rectangleColor = {
  red: 'rgba(255, 0, 0, 0.5)',
  orange: 'rgba(255, 165, 0, 0.5)',
  yellow: 'rgba(255, 255, 0, 0.5)',
  green: 'rgba(0, 255, 0, 0.5)'
}

const getColorByCoverage = (coverage: number): string => {
  if (coverage === 0) return rectangleColor.red
  else if (coverage > 0 && coverage < 50) return rectangleColor.orange
  else if (coverage >= 50 && coverage < 100) return rectangleColor.yellow
  else return rectangleColor.green
}

const createNode = (id: string, requirementCoverage: number): RectangleNode => {
  return {
    id,
    type: 'rectangle',
    position: defaultPosition,
    data: {
      index: parseInt(id),
      requirementCoverage,
      color: getColorByCoverage(requirementCoverage),
      nodesInLevel: defaultNodesInLevel,
      width: defaultWidth,
      height: defaultHeight
    }
  }
}

export const generateTreeNodes = (): {
  nodes: RectangleNode[]
  level1Nodes: number[]
  level2Nodes: number[]
  level3Nodes: number[]
} => {
  const nodes: RectangleNode[] = []
  let nodeId = 0

  const rootNode = createNode(String(nodeId++), Math.floor(Math.random() * 101))
  nodes.push(rootNode)

  const level1Count = Math.floor(Math.random() * 5) + 3
  const level1Nodes: number[] = []
  for (let i = 0; i < level1Count; i++) {
    const node = createNode(String(nodeId), Math.floor(Math.random() * 101))
    nodes.push(node)
    level1Nodes.push(nodeId)
    nodeId++
  }

  const level2Nodes: number[] = []
  for (const parentId of level1Nodes) {
    const childCount = Math.floor(Math.random() * 5) + 3
    for (let i = 0; i < childCount; i++) {
      const node = createNode(String(nodeId), Math.floor(Math.random() * 101))
      nodes.push(node)
      level2Nodes.push(nodeId)
      nodeId++
    }
  }

  const level3Nodes: number[] = []
  for (const parentId of level2Nodes) {
    const childCount = Math.floor(Math.random() * 5) + 3
    for (let i = 0; i < childCount; i++) {
      const node = createNode(String(nodeId), Math.floor(Math.random() * 101))
      nodes.push(node)
      level3Nodes.push(nodeId)
      nodeId++
    }
  }

  return { nodes, level1Nodes, level2Nodes, level3Nodes }
}

const {
  nodes: generatedNodes,
  level1Nodes,
  level2Nodes,
  level3Nodes
} = generateTreeNodes()
export const initialNodes: RectangleNode[] = generatedNodes
export { level1Nodes, level2Nodes, level3Nodes }

/* eslint-enable */
