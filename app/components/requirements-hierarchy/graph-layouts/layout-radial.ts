import { type Node } from 'reactflow'
import {
  type AcyclicGraphVertexViewerProps,
  type VertexData
} from '../acyclic-graph-vertex-viewer'
import { type Vertex } from '../acyclic-graph-viewer'

/* eslint-disable */

type AcyclicGraphNode = Node<AcyclicGraphVertexViewerProps<VertexData>>

const calculateNodePositions = (
  leveledNodes: AcyclicGraphNode[],
  vertexes: Vertex[],
  containerWidth: number,
  containerHeight: number,
  maxLevels: number = 5
): AcyclicGraphNode[] => {
  const ROOT_RADIUS = 160
  const LEVEL_RADIUS_STEP = 220
  const START_ANGLE = -Math.PI / 2

  const nodePositions = new Map<string, { x: number; y: number }>()
  const nodesByLevel = new Map<number, AcyclicGraphNode[]>()

  leveledNodes.forEach((node) => {
    const level = node.data.level
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, [])
    }
    nodesByLevel.get(level)!.push(node)
  })

  const sortedLevels = Array.from(nodesByLevel.keys())
    .filter((level) => level < maxLevels)
    .sort((a, b) => a - b)

  const centerX = containerWidth / 2
  const centerY = containerHeight / 2

  const sortNodesWithinLevel = (nodes: AcyclicGraphNode[]): AcyclicGraphNode[] => {
    return [...nodes].sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
  }

  sortedLevels.forEach((level) => {
    const rawLevelNodes = nodesByLevel.get(level) || []
    const levelNodes = sortNodesWithinLevel(rawLevelNodes)

    if (levelNodes.length === 0) return

    const radius = level === 0 ? ROOT_RADIUS : ROOT_RADIUS + level * LEVEL_RADIUS_STEP

    if (levelNodes.length === 1) {
      nodePositions.set(levelNodes[0].id, {
        x: centerX,
        y: centerY - radius
      })
      return
    }

    const angleStep = (Math.PI * 2) / levelNodes.length

    levelNodes.forEach((node, index) => {
      const angle = START_ANGLE + index * angleStep

      nodePositions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      })
    })
  })

  return leveledNodes.map((node) => {
    const position = nodePositions.get(node.id) || {
      x: centerX,
      y: centerY
    }

    return {
      ...node,
      position,
      data: {
        ...node.data
      }
    }
  })
}

export default calculateNodePositions