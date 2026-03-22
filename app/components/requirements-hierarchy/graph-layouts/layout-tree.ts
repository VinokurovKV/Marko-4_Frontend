import { type Node } from 'reactflow'
import {
  type AcyclicGraphVertexViewerProps,
  type VertexData
} from '../acyclic-graph-vertex-viewer'
import { type Vertex } from '../acyclic-graph-viewer'

type AcyclicGraphNode = Node<AcyclicGraphVertexViewerProps<VertexData>>

const calculateNodePositions = (
  leveledNodes: AcyclicGraphNode[],
  vertexes: Vertex[],
  containerWidth: number,
  containerHeight: number,
  maxLevels: number = 5
): AcyclicGraphNode[] => {
  const NODE_WIDTH = 240
  const HORIZONTAL_PADDING = 40
  const VERTICAL_SPACING = 200
  const LEVEL_VERTICAL_PADDING = 80
  const VERTICAL_STACK_SPACING = 110

  const nodePositions = new Map<string, { x: number; y: number }>()

  const vertexMap = new Map<number, Vertex>()
  const vertexOrder = new Map<number, number>()

  vertexes.forEach((v, index) => {
    vertexMap.set(v.id, v)
    vertexOrder.set(v.id, index)
  })

  const nodesByLevel = new Map<number, AcyclicGraphNode[]>()

  leveledNodes.forEach((node) => {
    const level = node.data.level
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, [])
    }
    nodesByLevel.get(level)!.push(node)
  })

  const getSortedByVertexOrder = (
    nodes: AcyclicGraphNode[]
  ): AcyclicGraphNode[] => {
    return [...nodes].sort((a, b) => {
      const aOrder = vertexOrder.get(parseInt(a.id, 10)) || 0
      const bOrder = vertexOrder.get(parseInt(b.id, 10)) || 0
      return aOrder - bOrder
    })
  }

  const getPrimaryParentId = (node: AcyclicGraphNode): string | null => {
    const vertexId = parseInt(node.id, 10)
    const vertex = vertexMap.get(vertexId)

    if (!vertex || vertex.parentsIds.length === 0) {
      return null
    }

    return vertex.parentsIds[0].toString()
  }

  const placeRootNodes = (): void => {
    const rootNodes = nodesByLevel.get(0) || []
    if (rootNodes.length === 0) return

    const sortedRoots = getSortedByVertexOrder(rootNodes)

    const totalWidth =
      sortedRoots.length * (NODE_WIDTH + HORIZONTAL_PADDING) -
      HORIZONTAL_PADDING
    const startX = (containerWidth - totalWidth) / 2 + NODE_WIDTH / 2
    const y = LEVEL_VERTICAL_PADDING

    sortedRoots.forEach((node, index) => {
      const x = startX + index * (NODE_WIDTH + HORIZONTAL_PADDING)
      nodePositions.set(node.id, { x, y })
    })
  }

  const placeChildrenUnderParents = (level: number): void => {
    const levelNodes = nodesByLevel.get(level) || []
    if (levelNodes.length === 0) return

    const parentLevel = level - 1
    const parentNodes = nodesByLevel.get(parentLevel) || []

    const orderedParents = getSortedByVertexOrder(parentNodes)

    const childrenByParent = new Map<string, AcyclicGraphNode[]>()
    const childrenWithoutParent: AcyclicGraphNode[] = []

    levelNodes.forEach((childNode) => {
      const parentId = getPrimaryParentId(childNode)

      if (parentId) {
        if (!childrenByParent.has(parentId)) {
          childrenByParent.set(parentId, [])
        }
        childrenByParent.get(parentId)!.push(childNode)
      } else {
        childrenWithoutParent.push(childNode)
      }
    })

    childrenByParent.forEach((children, parentId) => {
      childrenByParent.set(parentId, getSortedByVertexOrder(children))
    })

    const y = LEVEL_VERTICAL_PADDING + level * VERTICAL_SPACING
    let currentX = 0

    orderedParents.forEach((parentNode, parentIndex) => {
      const children = childrenByParent.get(parentNode.id) || []
      if (children.length === 0) return

      const parentPos = nodePositions.get(parentNode.id)
      if (!parentPos) return

      const isFirstParent = parentIndex === 0

      if (isFirstParent) {
        currentX =
          parentPos.x -
          ((children.length - 1) * (NODE_WIDTH + HORIZONTAL_PADDING)) / 2
      } else {
        const prevParent = orderedParents[parentIndex - 1]
        const prevChildren = childrenByParent.get(prevParent.id) || []

        if (prevChildren.length > 0) {
          const lastChildId = prevChildren[prevChildren.length - 1].id
          const lastChildPos = nodePositions.get(lastChildId)

          if (lastChildPos) {
            currentX = lastChildPos.x + NODE_WIDTH + HORIZONTAL_PADDING
          }
        }

        currentX = Math.max(
          currentX,
          parentPos.x -
            ((children.length - 1) * (NODE_WIDTH + HORIZONTAL_PADDING)) / 2
        )
      }

      children.forEach((child, index) => {
        const x = currentX + index * (NODE_WIDTH + HORIZONTAL_PADDING)
        nodePositions.set(child.id, { x, y })
      })

      currentX +=
        children.length * (NODE_WIDTH + HORIZONTAL_PADDING) + HORIZONTAL_PADDING
    })

    if (childrenWithoutParent.length > 0) {
      const sortedChildrenWithoutParent = getSortedByVertexOrder(
        childrenWithoutParent
      )
      const totalWidth =
        sortedChildrenWithoutParent.length * (NODE_WIDTH + HORIZONTAL_PADDING) -
        HORIZONTAL_PADDING
      const startX = (containerWidth - totalWidth) / 2 + NODE_WIDTH / 2

      sortedChildrenWithoutParent.forEach((node, index) => {
        const x = startX + index * (NODE_WIDTH + HORIZONTAL_PADDING)
        nodePositions.set(node.id, { x, y })
      })
    }
  }

  const placeLevelThreeUnderOwnParents = (): void => {
    const level = 3
    const levelNodes = nodesByLevel.get(level) || []
    if (levelNodes.length === 0) return

    const y = LEVEL_VERTICAL_PADDING + level * VERTICAL_SPACING

    const childrenByParent = new Map<string, AcyclicGraphNode[]>()
    const childrenWithoutParent: AcyclicGraphNode[] = []

    levelNodes.forEach((childNode) => {
      const parentId = getPrimaryParentId(childNode)

      if (parentId !== null && nodePositions.has(parentId)) {
        if (!childrenByParent.has(parentId)) {
          childrenByParent.set(parentId, [])
        }
        childrenByParent.get(parentId)!.push(childNode)
      } else {
        childrenWithoutParent.push(childNode)
      }
    })

    type PlannedChild = {
      node: AcyclicGraphNode
      desiredX: number
    }

    const plannedChildren: PlannedChild[] = []

    childrenByParent.forEach((children, parentId) => {
      const parentPos = nodePositions.get(parentId)
      if (!parentPos) return

      const sortedChildren = getSortedByVertexOrder(children)
      const centerOffset = (sortedChildren.length - 1) / 2

      sortedChildren.forEach((child, index) => {
        const desiredX =
          parentPos.x +
          (index - centerOffset) * (NODE_WIDTH + HORIZONTAL_PADDING)

        plannedChildren.push({
          node: child,
          desiredX
        })
      })
    })

    plannedChildren.sort((a, b) => a.desiredX - b.desiredX)

    let lastPlacedX = Number.NEGATIVE_INFINITY

    plannedChildren.forEach(({ node, desiredX }) => {
      const x =
        lastPlacedX === Number.NEGATIVE_INFINITY
          ? desiredX
          : Math.max(desiredX, lastPlacedX + NODE_WIDTH + HORIZONTAL_PADDING)

      nodePositions.set(node.id, { x, y })
      lastPlacedX = x
    })

    if (childrenWithoutParent.length > 0) {
      const sortedOrphans = getSortedByVertexOrder(childrenWithoutParent)
      const totalWidth =
        sortedOrphans.length * (NODE_WIDTH + HORIZONTAL_PADDING) -
        HORIZONTAL_PADDING

      const startX =
        lastPlacedX === Number.NEGATIVE_INFINITY
          ? (containerWidth - totalWidth) / 2 + NODE_WIDTH / 2
          : lastPlacedX + NODE_WIDTH + HORIZONTAL_PADDING

      sortedOrphans.forEach((node, index) => {
        const x = startX + index * (NODE_WIDTH + HORIZONTAL_PADDING)
        nodePositions.set(node.id, { x, y })
      })
    }
  }

  const placeLevelFourInColumnsUnderLevelThree = (): void => {
    const level = 4
    const levelNodes = nodesByLevel.get(level) || []
    if (levelNodes.length === 0) return

    const parentNodes = getSortedByVertexOrder(nodesByLevel.get(3) || [])

    const childrenByParent = new Map<string, AcyclicGraphNode[]>()
    const childrenWithoutParent: AcyclicGraphNode[] = []

    levelNodes.forEach((childNode) => {
      const parentId = getPrimaryParentId(childNode)

      if (parentId) {
        if (!childrenByParent.has(parentId)) {
          childrenByParent.set(parentId, [])
        }
        childrenByParent.get(parentId)!.push(childNode)
      } else {
        childrenWithoutParent.push(childNode)
      }
    })

    childrenByParent.forEach((children, parentId) => {
      childrenByParent.set(parentId, getSortedByVertexOrder(children))
    })

    parentNodes.forEach((parentNode) => {
      const children = childrenByParent.get(parentNode.id) || []
      if (children.length === 0) return

      const parentPos = nodePositions.get(parentNode.id)
      if (!parentPos) return

      children.forEach((child, index) => {
        nodePositions.set(child.id, {
          x: parentPos.x,
          y: parentPos.y + VERTICAL_SPACING + index * VERTICAL_STACK_SPACING
        })
      })
    })

    if (childrenWithoutParent.length > 0) {
      const fallbackX = containerWidth / 2
      const baseY = LEVEL_VERTICAL_PADDING + level * VERTICAL_SPACING

      getSortedByVertexOrder(childrenWithoutParent).forEach((node, index) => {
        nodePositions.set(node.id, {
          x: fallbackX,
          y: baseY + index * VERTICAL_STACK_SPACING
        })
      })
    }
  }

  const centerLevelUnderParent = (level: number): void => {
    if (level === 0 || level === 3 || level === 4) return

    const levelNodes = nodesByLevel.get(level) || []
    const parentNodes = nodesByLevel.get(level - 1) || []

    if (levelNodes.length === 0 || parentNodes.length === 0) return

    const parentPositions = parentNodes
      .map((parent) => nodePositions.get(parent.id))
      .filter((pos): pos is { x: number; y: number } => pos !== undefined)

    const levelPositions = levelNodes
      .map((node) => nodePositions.get(node.id))
      .filter((pos): pos is { x: number; y: number } => pos !== undefined)

    if (parentPositions.length === 0 || levelPositions.length === 0) return

    const parentLeft = Math.min(
      ...parentPositions.map((p) => p.x - NODE_WIDTH / 2)
    )
    const parentRight = Math.max(
      ...parentPositions.map((p) => p.x + NODE_WIDTH / 2)
    )
    const parentCenter = (parentLeft + parentRight) / 2

    const levelLeft = Math.min(
      ...levelPositions.map((p) => p.x - NODE_WIDTH / 2)
    )
    const levelRight = Math.max(
      ...levelPositions.map((p) => p.x + NODE_WIDTH / 2)
    )
    const levelCenter = (levelLeft + levelRight) / 2

    const offset = parentCenter - levelCenter

    levelNodes.forEach((node) => {
      const pos = nodePositions.get(node.id)
      if (!pos) return

      nodePositions.set(node.id, {
        x: pos.x + offset,
        y: pos.y
      })
    })
  }

  const adjustForOverlap = (): void => {
    for (let level = 0; level < maxLevels; level++) {
      if (level === 4) continue

      const levelNodes = nodesByLevel.get(level) || []
      if (levelNodes.length < 2) continue

      const positions = levelNodes
        .map((node) => {
          const pos = nodePositions.get(node.id)
          if (!pos) return null
          return { node, pos: { ...pos } }
        })
        .filter(
          (
            item
          ): item is {
            node: AcyclicGraphNode
            pos: { x: number; y: number }
          } => item !== null
        )

      positions.sort((a, b) => a.pos.x - b.pos.x)

      for (let i = 0; i < positions.length - 1; i++) {
        const current = positions[i]
        const next = positions[i + 1]

        const currentRightEdge = current.pos.x + NODE_WIDTH / 2
        const nextLeftEdge = next.pos.x - NODE_WIDTH / 2

        if (nextLeftEdge - currentRightEdge < HORIZONTAL_PADDING) {
          const overlap = HORIZONTAL_PADDING - (nextLeftEdge - currentRightEdge)
          next.pos.x += overlap
          nodePositions.set(next.node.id, next.pos)
        }
      }
    }
  }

  placeRootNodes()

  for (let level = 1; level < maxLevels; level++) {
    if (level === 3) {
      placeLevelThreeUnderOwnParents()
      continue
    }

    if (level === 4) {
      placeLevelFourInColumnsUnderLevelThree()
      continue
    }

    placeChildrenUnderParents(level)
  }

  for (let level = 1; level < maxLevels; level++) {
    centerLevelUnderParent(level)
  }

  adjustForOverlap()

  void containerHeight

  return leveledNodes.map((node) => {
    const position = nodePositions.get(node.id) || { x: 0, y: 0 }

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
