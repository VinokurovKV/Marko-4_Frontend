/* eslint-disable */

import { type Edge, MarkerType } from 'reactflow'
import 'reactflow/dist/style.css'
import {
  initialNodes,
  type RectangleNode,
  level1Nodes,
  level2Nodes,
  level3Nodes
} from './nodes'

const createEdge = (source: number, target: number): Edge => {
  return {
    id: `e${String(source)}-${String(target)}`,
    source: String(source),
    target: String(target),
    ...edgeStyle
  }
}

export const edgeStyle = {
  markerEnd: {
    type: 'arrowclosed' as MarkerType,
    strokeWidth: 5
  },
  style: {
    strokeWidth: 2
  }
}

const getRandomConnections = (): number => {
  const random = Math.random()
  if (random < 0.5) return 0
  else if (random < 0.9) return 1
  else return 2
}

export const generateTreeEdges = (
  level1Nodes: number[],
  level2Nodes: number[],
  level3Nodes: number[]
): Edge[] => {
  const edges: Edge[] = []
  const rootNodeId = 0

  const edgeExists = (source: number, target: number): boolean => {
    return edges.some(
      (edge) => edge.source === String(source) && edge.target === String(target)
    )
  }

  for (const childId of level1Nodes) {
    edges.push(createEdge(rootNodeId, childId))
  }

  const availableLevel2Nodes = [...level2Nodes]

  for (const targetId of availableLevel2Nodes) {
    const randomSourceId =
      level1Nodes[Math.floor(Math.random() * level1Nodes.length)]
    if (!edgeExists(randomSourceId, targetId)) {
      edges.push(createEdge(randomSourceId, targetId))
    }
  }

  for (const sourceId of level1Nodes) {
    const additionalConnections = getRandomConnections()

    if (additionalConnections > 0) {
      const shuffledLevel2Nodes = [...level2Nodes].sort(
        () => Math.random() - 0.5
      )
      let connectionsCreated = 0

      for (const targetId of shuffledLevel2Nodes) {
        if (connectionsCreated >= additionalConnections) break

        if (!edgeExists(sourceId, targetId)) {
          edges.push(createEdge(sourceId, targetId))
          connectionsCreated++
        }
      }
    }
  }

  const availableLevel3Nodes = [...level3Nodes]

  for (const targetId of availableLevel3Nodes) {
    const randomSourceId =
      level2Nodes[Math.floor(Math.random() * level2Nodes.length)]
    if (!edgeExists(randomSourceId, targetId)) {
      edges.push(createEdge(randomSourceId, targetId))
    }
  }

  for (const sourceId of level2Nodes) {
    const additionalConnections = getRandomConnections()

    if (additionalConnections > 0) {
      const shuffledLevel3Nodes = [...level3Nodes].sort(
        () => Math.random() - 0.5
      )
      let connectionsCreated = 0

      for (const targetId of shuffledLevel3Nodes) {
        if (connectionsCreated >= additionalConnections) break

        if (!edgeExists(sourceId, targetId)) {
          edges.push(createEdge(sourceId, targetId))
          connectionsCreated++
        }
      }
    }
  }

  return edges
}

export const initialEdges: Edge[] = generateTreeEdges(
  level1Nodes,
  level2Nodes,
  level3Nodes
)

/* eslint-enable */
