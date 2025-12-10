import { type Node } from 'reactflow'
import 'reactflow/dist/style.css'
import { type RectangleProps, getColorByCoverage } from '../rectangle'

export type RectangleNode = Node<RectangleProps>

const defaultPosition = {
  x: 0,
  y: 0
}

const defaultNodesInLevel = 0
const defaultWidth = 0
const defaultHeight = 0

const getNodeLevel = (nodeId: string): number => {
  if (nodeId === '3') return 0

  if (nodeId.includes('.')) {
    return nodeId.split('.').length - 1
  }

  return 0
}

const calculateParentCoverage = (
  children: RectangleNode[]
): { all: string; must: string } => {
  let totalAllNumerator = 0
  let totalAllDenominator = 0
  let totalMustNumerator = 0
  let totalMustDenominator = 0

  children.forEach((child) => {
    const [allNum, allDen] = child.data.requirementCoverageAll
      .split('/')
      .map(Number)
    const [mustNum, mustDen] = child.data.requirementCoverageMust
      .split('/')
      .map(Number)

    totalAllNumerator += allNum
    totalAllDenominator += allDen
    totalMustNumerator += mustNum
    totalMustDenominator += mustDen
  })

  return {
    all: `${totalAllNumerator}/${totalAllDenominator}`,
    must: `${totalMustNumerator}/${totalMustDenominator}`
  }
}

const buildGraphWithAutoCoverage = (
  leafNodes: RectangleNode[]
): RectangleNode[] => {
  const allNodes = [...leafNodes]
  const nodesById = new Map<string, RectangleNode>()

  leafNodes.forEach((node) => {
    nodesById.set(node.id, node)
  })

  const allNodeIds = new Set(leafNodes.map((node) => node.id))

  const getAllParentIds = (nodeId: string): string[] => {
    const parts = nodeId.split('.')
    const parentIds: string[] = []

    for (let i = 1; i < parts.length; i++) {
      parentIds.push(parts.slice(0, i).join('.'))
    }

    return parentIds
  }

  leafNodes.forEach((node) => {
    const parentIds = getAllParentIds(node.id)
    parentIds.forEach((parentId) => {
      allNodeIds.add(parentId)
    })
  })

  allNodeIds.forEach((nodeId) => {
    if (!nodesById.has(nodeId)) {
      const newNode = createNode(nodeId, '0/0', '0/0')
      nodesById.set(nodeId, newNode)
      allNodes.push(newNode)
    }
  })

  const childrenByParent = new Map<string, RectangleNode[]>()
  allNodes.forEach((node) => {
    const parentId = node.id.split('.').slice(0, -1).join('.')
    if (parentId && nodesById.has(parentId)) {
      if (!childrenByParent.has(parentId)) {
        childrenByParent.set(parentId, [])
      }
      childrenByParent.get(parentId)!.push(node)
    }
  })

  const sortedParentIds = Array.from(childrenByParent.keys()).sort(
    (a, b) => b.split('.').length - a.split('.').length
  )

  sortedParentIds.forEach((parentId) => {
    const children = childrenByParent.get(parentId) || []
    const coverage = calculateParentCoverage(children)

    const parentNode = nodesById.get(parentId)!
    parentNode.data.requirementCoverageAll = coverage.all
    parentNode.data.requirementCoverageMust = coverage.must
    parentNode.data.color = getColorByCoverage(coverage.must)
  })

  return allNodes
}

const createNode = (
  id: string,
  requirementCoverageAll: string,
  requirementCoverageMust: string
): RectangleNode => {
  const level = getNodeLevel(id)

  return {
    id,
    type: 'rectangle',
    position: defaultPosition,
    data: {
      index: id,
      requirementCoverageAll,
      requirementCoverageMust,
      color: getColorByCoverage(requirementCoverageMust),
      nodesInLevel: defaultNodesInLevel,
      width: defaultWidth,
      height: defaultHeight,
      level
    }
  }
}

const leafNodes: RectangleNode[] = [
  createNode('3.16.1.1', '0/1', '0/1'),
  createNode('3.16.1.2', '0/1', '0/1'),
  createNode('3.16.1.3', '0/1', '0/1'),
  createNode('3.16.1.4', '0/1', '0/1'),
  createNode('3.16.1.5', '0/1', '0/1'),
  createNode('3.16.1.6', '0/1', '0/1'),
  createNode('3.16.1.7', '0/1', '0/1'),
  createNode('3.16.1.8', '0/1', '0/1'),
  createNode('3.16.1.9', '0/1', '0/1'),
  createNode('3.16.1.10', '0/1', '0/1'),
  createNode('3.16.1.11', '0/1', '0/1'),
  createNode('3.16.1.12', '0/1', '0/1'),
  createNode('3.16.1.13', '0/1', '0/1'),
  createNode('3.16.1.14', '0/1', '0/1'),
  createNode('3.16.1.15', '0/1', '0/1'),
  createNode('3.16.2.1', '0/1', '0/1'),
  createNode('3.16.2.2', '0/1', '0/1'),
  createNode('3.16.3.1', '0/1', '0/1'),
  createNode('3.16.3.2', '0/1', '0/1'),
  createNode('3.16.4.1', '0/1', '0/1'),
  createNode('3.16.4.2', '0/1', '0/1'),
  createNode('3.16.4.3', '0/1', '0/1'),
  createNode('3.16.4.4', '0/1', '0/1'),
  createNode('3.16.4.5', '0/1', '0/1'),
  createNode('3.16.4.6', '0/1', '0/1'),
  createNode('3.16.4.7', '0/1', '0/1'),
  createNode('3.16.5.1', '0/1', '0/1'),
  createNode('3.16.5.2', '0/1', '0/1'),
  createNode('3.16.5.3', '0/1', '0/1'),
  createNode('3.16.5.4', '0/1', '0/1'),
  createNode('3.16.6.1', '0/1', '0/1'),
  createNode('3.16.6.2', '0/1', '0/1'),
  createNode('3.16.6.3', '0/1', '0/1'),
  createNode('3.16.6.4', '0/1', '0/1'),
  createNode('3.16.6.5', '0/1', '0/1'),
  createNode('3.16.6.6', '0/1', '0/1'),
  createNode('3.16.6.7', '0/1', '0/1'),
  createNode('3.16.7.1', '0/1', '0/1'),
  createNode('3.16.7.2', '0/1', '0/1'),
  createNode('3.16.7.3', '0/1', '0/1'),
  createNode('3.16.7.4', '0/1', '0/1'),
  createNode('3.16.7.5', '0/1', '0/1'),
  createNode('3.16.7.6', '0/1', '0/1'),
  createNode('3.16.7.7', '0/1', '0/1'),
  createNode('3.16.7.8', '0/1', '0/1'),
  createNode('3.17.1', '0/1', '0/1'),
  createNode('3.17.2', '0/1', '0/1'),
  createNode('3.17.2.1', '0/1', '0/1'),
  createNode('3.17.2.2', '0/1', '0/1'),
  createNode('3.17.2.3', '0/1', '0/1'),
  createNode('3.17.2.4', '0/1', '0/1'),
  createNode('3.17.2.5', '0/1', '0/1'),
  createNode('3.17.2.6', '0/1', '0/1'),
  createNode('3.17.2.7', '0/1', '0/1'),
  createNode('3.17.2.8', '0/1', '0/1'),
  createNode('3.17.2.9', '0/1', '0/1'),
  createNode('3.17.2.10', '0/1', '0/1'),
  createNode('3.17.2.11', '0/1', '0/1'),
  createNode('3.17.2.12', '0/1', '0/1'),
  createNode('3.17.2.13', '0/1', '0/1'),
  createNode('3.17.2.14', '0/1', '0/1'),
  createNode('3.17.2.15', '0/1', '0/1'),
  createNode('3.17.2.16', '0/1', '0/1'),
  createNode('3.17.2.17', '0/1', '0/1'),
  createNode('3.17.2.18', '0/1', '0/1'),
  createNode('3.17.2.19', '0/1', '0/1'),
  createNode('3.17.2.20', '0/1', '0/1'),
  createNode('3.17.2.21', '0/1', '0/1'),
  createNode('3.17.2.22', '0/1', '0/1'),
  createNode('3.17.2.23', '0/1', '0/1'),
  createNode('3.17.2.24', '0/1', '0/1'),
  createNode('3.17.2.25', '0/1', '0/1'),
  createNode('3.17.2.26', '0/1', '0/1'),
  createNode('3.17.2.27', '0/1', '0/1'),
  createNode('3.17.2.28', '0/1', '0/1'),
  createNode('3.17.2.29', '0/1', '0/1'),
  createNode('3.17.2.30', '0/1', '0/1'),
  createNode('3.17.2.31', '0/1', '0/1'),
  createNode('3.17.2.32', '0/1', '0/1'),
  createNode('3.17.2.33', '0/1', '0/1'),
  createNode('3.17.2.34', '0/1', '0/1'),
  createNode('3.17.2.35.1.1', '1/1', '1/1'),
  createNode('3.17.2.35.1.2', '1/1', '1/1'),
  createNode('3.17.2.35.1.3', '1/1', '1/1'),
  createNode('3.17.2.35.1.4', '1/1', '1/1'),
  createNode('3.17.2.35.1.5', '1/1', '1/1'),
  createNode('3.17.2.35.1.6', '1/1', '1/1'),
  createNode('3.17.2.35.1.7', '1/1', '1/1'),
  createNode('3.17.2.35.1.8', '1/1', '1/1'),
  createNode('3.17.2.35.1.9', '0/1', '0/1'),
  createNode('3.17.2.35.1.10', '1/1', '1/1'),
  createNode('3.17.2.35.1.11', '1/1', '1/1'),
  createNode('3.17.2.35.2.1', '1/1', '1/1'),
  createNode('3.17.2.35.2.2', '1/1', '1/1'),
  createNode('3.17.2.35.2.3', '1/1', '1/1'),
  createNode('3.17.2.35.2.4', '1/1', '1/1'),
  createNode('3.17.2.35.2.5', '1/1', '1/1'),
  createNode('3.17.2.35.2.6', '1/1', '1/1'),
  createNode('3.17.2.35.2.7', '1/1', '0/0'),
  createNode('3.17.2.35.2.8', '1/1', '0/0'),
  createNode('3.17.2.35.2.9', '1/1', '1/1'),
  createNode('3.17.2.35.2.10', '0/1', '0/0'),
  createNode('3.17.2.35.2.11', '1/1', '1/1'),
  createNode('3.17.2.35.3.1', '1/1', '1/1'),
  createNode('3.17.2.35.3.2', '1/1', '1/1'),
  createNode('3.17.2.35.3.3', '1/1', '1/1'),
  createNode('3.17.2.35.3.4', '1/1', '1/1'),
  createNode('3.17.2.35.3.5', '1/1', '1/1'),
  createNode('3.17.2.35.4.1', '1/1', '0/0'),
  createNode('3.17.2.35.4.2', '1/1', '0/0'),
  createNode('3.17.2.35.5.1', '1/1', '1/1'),
  createNode('3.17.2.35.5.2', '1/1', '1/1'),
  createNode('3.17.2.35.5.3', '1/1', '1/1'),
  createNode('3.17.2.35.5.4', '1/1', '0/0'),
  createNode('3.17.2.35.5.5', '1/1', '1/1'),
  createNode('3.17.2.35.5.6', '1/1', '1/1'),
  createNode('3.17.2.35.5.7', '1/1', '1/1'),
  createNode('3.17.2.35.6.1', '1/1', '1/1'),
  createNode('3.17.2.35.6.2', '1/1', '0/0'),
  createNode('3.17.2.35.6.3', '1/1', '1/1'),
  createNode('3.17.2.35.6.4', '1/1', '1/1'),
  createNode('3.17.2.35.6.5', '1/1', '1/1'),
  createNode('3.17.2.35.7.1', '1/1', '1/1'),
  createNode('3.17.2.35.7.2', '1/1', '1/1'),
  createNode('3.17.2.35.7.3', '1/1', '0/0'),
  createNode('3.17.2.35.7.4', '1/1', '1/1'),
  createNode('3.17.2.35.7.5', '1/1', '1/1'),
  createNode('3.17.2.35.7.6', '1/1', '1/1'),
  createNode('3.17.2.35.7.7', '1/1', '1/1'),
  createNode('3.17.2.35.8.1', '0/1', '0/1'),
  createNode('3.17.2.35.8.2', '0/1', '0/1'),
  createNode('3.17.2.35.8.3', '0/1', '0/1'),
  createNode('3.17.2.35.8.4', '0/1', '0/1'),
  createNode('3.17.2.35.8.5', '0/1', '0/1'),
  createNode('3.17.2.35.8.6', '0/1', '0/1'),
  createNode('3.17.2.35.8.7', '0/1', '0/1'),
  createNode('3.17.2.35.8.8', '0/1', '0/1'),
  createNode('3.17.2.35.8.9', '0/1', '0/1'),
  createNode('3.17.2.35.8.10', '0/1', '0/1'),
  createNode('3.17.2.35.9.1', '1/1', '1/1'),
  createNode('3.17.2.35.9.2', '1/1', '1/1'),
  createNode('3.17.2.35.9.3', '1/1', '1/1'),
  createNode('3.17.2.35.9.4', '1/1', '1/1'),
  createNode('3.17.2.36', '0/1', '0/1'),
  createNode('3.17.2.37', '0/1', '0/1'),
  createNode('3.17.2.38', '0/1', '0/1'),
  createNode('3.17.2.39', '0/1', '0/1'),
  createNode('3.17.2.40', '0/1', '0/1'),
  createNode('3.17.2.41', '0/1', '0/1'),
  createNode('3.17.2.42', '0/1', '0/1'),
  createNode('3.17.2.43', '0/1', '0/1'),
  createNode('3.17.2.44', '0/1', '0/1'),
  createNode('3.17.2.45', '0/1', '0/1'),
  createNode('3.17.2.46', '0/1', '0/1'),
  createNode('3.17.2.47', '0/1', '0/1'),
  createNode('3.17.2.48', '0/1', '0/1'),
  createNode('3.17.2.49', '0/1', '0/1'),
  createNode('3.17.2.50', '0/1', '0/1'),
  createNode('3.17.2.51', '0/1', '0/1'),
  createNode('3.17.2.52', '0/1', '0/1'),
  createNode('3.17.2.53', '0/1', '0/1'),
  createNode('3.17.2.54', '0/1', '0/1'),
  createNode('3.17.2.55', '0/1', '0/1'),
  createNode('3.17.2.56', '0/1', '0/1'),
  createNode('3.17.2.57', '0/1', '0/1'),
  createNode('3.17.2.58', '0/1', '0/1'),
  createNode('3.17.2.59', '0/1', '0/1'),
  createNode('3.17.2.60', '0/1', '0/1'),
  createNode('3.17.2.61', '0/1', '0/1'),
  createNode('3.17.2.62', '0/1', '0/1'),
  createNode('3.17.2.63', '0/1', '0/1'),
  createNode('3.17.2.64', '0/1', '0/1'),
  createNode('3.17.2.65', '0/1', '0/1'),
  createNode('3.17.2.66', '0/1', '0/1'),
  createNode('3.17.2.67', '0/1', '0/1'),
  createNode('3.17.2.68', '0/1', '0/1'),
  createNode('3.17.2.69', '0/1', '0/1'),
  createNode('3.17.2.70', '0/1', '0/1'),
  createNode('3.17.3', '0/1', '0/1'),
  createNode('3.17.4', '0/1', '0/1'),
  createNode('3.17.5', '0/1', '0/1'),
  createNode('3.17.6', '0/1', '0/1'),
  createNode('3.17.7', '0/1', '0/1'),
  createNode('3.17.8', '0/1', '0/1'),
  createNode('3.17.9', '0/1', '0/1'),
  createNode('3.18.1', '0/1', '0/1'),
  createNode('3.18.2', '0/1', '0/1'),
  createNode('3.18.3', '0/1', '0/1')
]

export const initialNodes = buildGraphWithAutoCoverage(leafNodes)

export const blurredNodeIndexes: string[] = []

/*export const initialNodes: RectangleNode[] = [
  createNode('3', '0/1', '0/1'),
  createNode('3.16', '0/1', '0/1'),
  createNode('3.16.1', '0/1', '0/1'),
  createNode('3.16.1.1', '0/1', '0/1'),
  createNode('3.16.1.2', '0/1', '0/1'),
  createNode('3.16.1.3', '0/1', '0/1'),
  createNode('3.16.1.4', '0/1', '0/1'),
  createNode('3.16.1.5', '0/1', '0/1'),
  createNode('3.16.1.6', '0/1', '0/1'),
  createNode('3.16.1.7', '0/1', '0/1'),
  createNode('3.16.1.8', '0/1', '0/1'),
  createNode('3.16.1.9', '0/1', '0/1'),
  createNode('3.16.1.10', '0/1', '0/1'),
  createNode('3.16.1.11', '0/1', '0/1'),
  createNode('3.16.1.12', '0/1', '0/1'),
  createNode('3.16.1.13', '0/1', '0/1'),
  createNode('3.16.1.14', '0/1', '0/1'),
  createNode('3.16.1.15', '0/1', '0/1'),
  createNode('3.16.2', '0/1', '0/1'),
  createNode('3.16.2.1', '0/1', '0/1'),
  createNode('3.16.2.2', '0/1', '0/1'),
  createNode('3.16.3', '0/1', '0/1'),
  createNode('3.16.3.1', '0/1', '0/1'),
  createNode('3.16.3.2', '0/1', '0/1'),
  createNode('3.16.4', '0/1', '0/1'),
  createNode('3.16.4.1', '0/1', '0/1'),
  createNode('3.16.4.2', '0/1', '0/1'),
  createNode('3.16.4.3', '0/1', '0/1'),
  createNode('3.16.4.4', '0/1', '0/1'),
  createNode('3.16.4.5', '0/1', '0/1'),
  createNode('3.16.4.6', '0/1', '0/1'),
  createNode('3.16.4.7', '0/1', '0/1'),
  createNode('3.16.5', '0/1', '0/1'),
  createNode('3.16.5.1', '0/1', '0/1'),
  createNode('3.16.5.2', '0/1', '0/1'),
  createNode('3.16.5.3', '0/1', '0/1'),
  createNode('3.16.5.4', '0/1', '0/1'),
  createNode('3.16.6', '0/1', '0/1'),
  createNode('3.16.6.1', '0/1', '0/1'),
  createNode('3.16.6.2', '0/1', '0/1'),
  createNode('3.16.6.3', '0/1', '0/1'),
  createNode('3.16.6.4', '0/1', '0/1'),
  createNode('3.16.6.5', '0/1', '0/1'),
  createNode('3.16.6.6', '0/1', '0/1'),
  createNode('3.16.6.7', '0/1', '0/1'),
  createNode('3.16.7', '0/1', '0/1'),
  createNode('3.16.7.1', '0/1', '0/1'),
  createNode('3.16.7.2', '0/1', '0/1'),
  createNode('3.16.7.3', '0/1', '0/1'),
  createNode('3.16.7.4', '0/1', '0/1'),
  createNode('3.16.7.5', '0/1', '0/1'),
  createNode('3.16.7.6', '0/1', '0/1'),
  createNode('3.16.7.7', '0/1', '0/1'),
  createNode('3.16.7.8', '0/1', '0/1'),
  createNode('3.17', '0/1', '0/1'),
  createNode('3.17.1', '0/1', '0/1'),
  createNode('3.17.2', '0/1', '0/1'),
  createNode('3.17.2.1', '0/1', '0/1'),
  createNode('3.17.2.2', '0/1', '0/1'),
  createNode('3.17.2.3', '0/1', '0/1'),
  createNode('3.17.2.4', '0/1', '0/1'),
  createNode('3.17.2.5', '0/1', '0/1'),
  createNode('3.17.2.6', '0/1', '0/1'),
  createNode('3.17.2.7', '0/1', '0/1'),
  createNode('3.17.2.8', '0/1', '0/1'),
  createNode('3.17.2.9', '0/1', '0/1'),
  createNode('3.17.2.10', '0/1', '0/1'),
  createNode('3.17.2.11', '0/1', '0/1'),
  createNode('3.17.2.12', '0/1', '0/1'),
  createNode('3.17.2.13', '0/1', '0/1'),
  createNode('3.17.2.14', '0/1', '0/1'),
  createNode('3.17.2.15', '0/1', '0/1'),
  createNode('3.17.2.16', '0/1', '0/1'),
  createNode('3.17.2.17', '0/1', '0/1'),
  createNode('3.17.2.18', '0/1', '0/1'),
  createNode('3.17.2.19', '0/1', '0/1'),
  createNode('3.17.2.20', '0/1', '0/1'),
  createNode('3.17.2.21', '0/1', '0/1'),
  createNode('3.17.2.22', '0/1', '0/1'),
  createNode('3.17.2.23', '0/1', '0/1'),
  createNode('3.17.2.24', '0/1', '0/1'),
  createNode('3.17.2.25', '0/1', '0/1'),
  createNode('3.17.2.26', '0/1', '0/1'),
  createNode('3.17.2.27', '0/1', '0/1'),
  createNode('3.17.2.28', '0/1', '0/1'),
  createNode('3.17.2.29', '0/1', '0/1'),
  createNode('3.17.2.30', '0/1', '0/1'),
  createNode('3.17.2.31', '0/1', '0/1'),
  createNode('3.17.2.32', '0/1', '0/1'),
  createNode('3.17.2.33', '0/1', '0/1'),
  createNode('3.17.2.34', '0/1', '0/1'),
  createNode('3.17.2.35', '48/62', '42/54'),
  createNode('3.17.2.35.1', '10/11', '10/11'),
  createNode('3.17.2.35.1.1', '1/1', '1/1'),
  createNode('3.17.2.35.1.2', '1/1', '1/1'),
  createNode('3.17.2.35.1.3', '1/1', '1/1'),
  createNode('3.17.2.35.1.4', '1/1', '1/1'),
  createNode('3.17.2.35.1.5', '1/1', '1/1'),
  createNode('3.17.2.35.1.6', '1/1', '1/1'),
  createNode('3.17.2.35.1.7', '1/1', '1/1'),
  createNode('3.17.2.35.1.8', '1/1', '1/1'),
  createNode('3.17.2.35.1.9', '0/1', '0/1'),
  createNode('3.17.2.35.1.10', '1/1', '1/1'),
  createNode('3.17.2.35.1.11', '1/1', '1/1'),
  createNode('3.17.2.35.2', '10/11', '8/8'),
  createNode('3.17.2.35.2.1', '1/1', '1/1'),
  createNode('3.17.2.35.2.2', '1/1', '1/1'),
  createNode('3.17.2.35.2.3', '1/1', '1/1'),
  createNode('3.17.2.35.2.4', '1/1', '1/1'),
  createNode('3.17.2.35.2.5', '1/1', '1/1'),
  createNode('3.17.2.35.2.6', '1/1', '1/1'),
  createNode('3.17.2.35.2.7', '1/1', '1/0'),
  createNode('3.17.2.35.2.8', '1/1', '1/0'),
  createNode('3.17.2.35.2.9', '1/1', '1/1'),
  createNode('3.17.2.35.2.10', '0/1', '0/0'),
  createNode('3.17.2.35.2.11', '1/1', '1/1'),
  createNode('3.17.2.35.3', '4/5', '4/5'),
  createNode('3.17.2.35.3.1', '1/1', '1/1'),
  createNode('3.17.2.35.3.2', '1/1', '1/1'),
  createNode('3.17.2.35.3.3', '1/1', '1/1'),
  createNode('3.17.2.35.3.4', '1/1', '1/1'),
  createNode('3.17.2.35.3.5', '0/1', '0/1'),
  createNode('3.17.2.35.4', '2/2', '0/0'),
  createNode('3.17.2.35.4.1', '1/1', '1/0'),
  createNode('3.17.2.35.4.2', '1/1', '1/0'),
  createNode('3.17.2.35.5', '7/7', '6/6'),
  createNode('3.17.2.35.5.1', '1/1', '1/1'),
  createNode('3.17.2.35.5.2', '1/1', '1/1'),
  createNode('3.17.2.35.5.3', '1/1', '1/1'),
  createNode('3.17.2.35.5.4', '1/1', '1/0'),
  createNode('3.17.2.35.5.5', '1/1', '1/1'),
  createNode('3.17.2.35.5.6', '1/1', '1/1'),
  createNode('3.17.2.35.5.7', '1/1', '1/1'),
  createNode('3.17.2.35.6', '5/5', '4/4'),
  createNode('3.17.2.35.6.1', '1/1', '1/1'),
  createNode('3.17.2.35.6.2', '1/1', '1/0'),
  createNode('3.17.2.35.6.3', '1/1', '1/1'),
  createNode('3.17.2.35.6.4', '1/1', '1/1'),
  createNode('3.17.2.35.6.5', '1/1', '1/1'),
  createNode('3.17.2.35.7', '7/7', '6/6'),
  createNode('3.17.2.35.7.1', '1/1', '1/1'),
  createNode('3.17.2.35.7.2', '1/1', '1/1'),
  createNode('3.17.2.35.7.3', '1/1', '1/0'),
  createNode('3.17.2.35.7.4', '1/1', '1/1'),
  createNode('3.17.2.35.7.5', '1/1', '1/1'),
  createNode('3.17.2.35.7.6', '1/1', '1/1'),
  createNode('3.17.2.35.7.7', '1/1', '1/1'),
  createNode('3.17.2.35.8', '0/10', '0/10'),
  createNode('3.17.2.35.8.1', '0/1', '0/1'),
  createNode('3.17.2.35.8.2', '0/1', '0/1'),
  createNode('3.17.2.35.8.3', '0/1', '0/1'),
  createNode('3.17.2.35.8.4', '0/1', '0/1'),
  createNode('3.17.2.35.8.5', '0/1', '0/1'),
  createNode('3.17.2.35.8.6', '0/1', '0/1'),
  createNode('3.17.2.35.8.7', '0/1', '0/1'),
  createNode('3.17.2.35.8.8', '0/1', '1/1'),
  createNode('3.17.2.35.8.9', '0/1', '0/1'),
  createNode('3.17.2.35.8.10', '1/1', '1/1'),
  createNode('3.17.2.35.9', '4/4', '4/4'),
  createNode('3.17.2.35.9.1', '1/1', '1/1'),
  createNode('3.17.2.35.9.2', '1/1', '1/1'),
  createNode('3.17.2.35.9.3', '1/1', '1/1'),
  createNode('3.17.2.35.9.4', '1/1', '1/1'),
  createNode('3.17.2.36', '0/1', '0/1'),
  createNode('3.17.2.37', '0/1', '0/1'),
  createNode('3.17.2.38', '0/1', '0/1'),
  createNode('3.17.2.39', '0/1', '0/1'),
  createNode('3.17.2.40', '0/1', '0/1'),
  createNode('3.17.2.41', '0/1', '0/1'),
  createNode('3.17.2.42', '0/1', '0/1'),
  createNode('3.17.2.43', '0/1', '0/1'),
  createNode('3.17.2.44', '0/1', '0/1'),
  createNode('3.17.2.45', '0/1', '0/1'),
  createNode('3.17.2.46', '0/1', '0/1'),
  createNode('3.17.2.47', '0/1', '0/1'),
  createNode('3.17.2.48', '0/1', '0/1'),
  createNode('3.17.2.49', '0/1', '0/1'),
  createNode('3.17.2.50', '0/1', '0/1'),
  createNode('3.17.2.51', '0/1', '0/1'),
  createNode('3.17.2.52', '0/1', '0/1'),
  createNode('3.17.2.53', '0/1', '0/1'),
  createNode('3.17.2.54', '0/1', '0/1'),
  createNode('3.17.2.55', '0/1', '0/1'),
  createNode('3.17.2.56', '0/1', '0/1'),
  createNode('3.17.2.57', '0/1', '0/1'),
  createNode('3.17.2.58', '0/1', '0/1'),
  createNode('3.17.2.59', '0/1', '0/1'),
  createNode('3.17.2.60', '0/1', '0/1'),
  createNode('3.17.2.61', '0/1', '0/1'),
  createNode('3.17.2.62', '0/1', '0/1'),
  createNode('3.17.2.63', '0/1', '0/1'),
  createNode('3.17.2.64', '0/1', '0/1'),
  createNode('3.17.2.65', '0/1', '0/1'),
  createNode('3.17.2.66', '0/1', '0/1'),
  createNode('3.17.2.67', '0/1', '0/1'),
  createNode('3.17.2.68', '0/1', '0/1'),
  createNode('3.17.2.69', '0/1', '0/1'),
  createNode('3.17.2.70', '0/1', '0/1'),
  createNode('3.17.3', '0/1', '0/1'),
  createNode('3.17.4', '0/1', '0/1'),
  createNode('3.17.5', '0/1', '0/1'),
  createNode('3.17.6', '0/1', '0/1'),
  createNode('3.17.7', '0/1', '0/1'),
  createNode('3.17.8', '0/1', '0/1'),
  createNode('3.17.9', '0/1', '0/1'),
  createNode('3.18', '0/1', '0/1'),
  createNode('3.18.1', '0/1', '0/1'),
  createNode('3.18.2', '0/1', '0/1'),
  createNode('3.18.3', '0/1', '0/1')
]*/
