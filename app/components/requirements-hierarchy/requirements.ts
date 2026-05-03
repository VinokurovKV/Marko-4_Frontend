// Project
import type { RequirementsHierarchy } from '~/types'
import { MarkerType } from 'reactflow'
import type { Vertex } from './acyclic-graph-viewer'

export type RequirementVertexData = {
  code: string
  level: number
  hasParents: boolean
  hasChildren: boolean
  atomicityFlag: boolean
  atomicityCoef: number
  modifier: string
  fullCoverageFraction: string
  onlyMustCoverageFraction: string
  mustAndShouldCoverageFraction: string
  onlyShouldCoverageFraction: string
  onlyMayCoverageFraction: string
  testId: number | null
}

type RequirementsHierarchyGraphData = {
  vertexes: Vertex[]
  dataForVertexId: Map<number, RequirementVertexData>
}

function buildGraphRelations(requirementsHierarchy: RequirementsHierarchy) {
  const parentIdsSetForId = new Map<number, Set<number>>()
  const childIdsSetForId = new Map<number, Set<number>>()

  for (const vertex of requirementsHierarchy.vertexes) {
    parentIdsSetForId.set(vertex.id, new Set<number>())
    childIdsSetForId.set(vertex.id, new Set<number>())
  }

  for (const link of requirementsHierarchy.links) {
    const childIdsSet = childIdsSetForId.get(link.parentId)
    const parentIdsSet = parentIdsSetForId.get(link.childId)

    if (childIdsSet !== undefined && parentIdsSet !== undefined) {
      childIdsSet.add(link.childId)
      parentIdsSet.add(link.parentId)
    }
  }

  return {
    parentIdsSetForId,
    childIdsSetForId
  }
}

function buildLevels(
  requirementsHierarchy: RequirementsHierarchy,
  parentIdsSetForId: Map<number, Set<number>>,
  childIdsSetForId: Map<number, Set<number>>
) {
  const levelForId = new Map<number, number>()
  const inDegreeForId = new Map<number, number>()

  for (const vertex of requirementsHierarchy.vertexes) {
    inDegreeForId.set(vertex.id, parentIdsSetForId.get(vertex.id)?.size ?? 0)
  }

  const queue = requirementsHierarchy.vertexes
    .map((vertex) => vertex.id)
    .filter((id) => (inDegreeForId.get(id) ?? 0) === 0)

  for (const id of queue) {
    levelForId.set(id, 0)
  }

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const currentLevel = levelForId.get(currentId) ?? 0
    const childIds = childIdsSetForId.get(currentId)

    if (childIds === undefined) {
      continue
    }

    for (const childId of childIds) {
      levelForId.set(
        childId,
        Math.max(levelForId.get(childId) ?? 0, currentLevel + 1)
      )
      const currentInDegree = inDegreeForId.get(childId) ?? 0
      const nextInDegree = Math.max(0, currentInDegree - 1)
      inDegreeForId.set(childId, nextInDegree)
      if (nextInDegree === 0) {
        queue.push(childId)
      }
    }
  }

  return levelForId
}

export function buildRequirementsHierarchyGraphData(
  requirementsHierarchy: RequirementsHierarchy
): RequirementsHierarchyGraphData {
  const { parentIdsSetForId, childIdsSetForId } = buildGraphRelations(
    requirementsHierarchy
  )
  const levelForId = buildLevels(
    requirementsHierarchy,
    parentIdsSetForId,
    childIdsSetForId
  )

  const vertexes: Vertex[] = requirementsHierarchy.vertexes.map((vertex) => ({
    id: vertex.id,
    parentsIds: Array.from(parentIdsSetForId.get(vertex.id) ?? []),
    childIds: Array.from(childIdsSetForId.get(vertex.id) ?? [])
  }))

  const dataForVertexId = new Map<number, RequirementVertexData>()
  for (const vertex of requirementsHierarchy.vertexes) {
    const parentsIds = parentIdsSetForId.get(vertex.id)
    const childIds = childIdsSetForId.get(vertex.id)
    const coveredFull = vertex.coveredRate.full
    const aggregateFull = vertex.aggregateRate.full
    const coveredOnlyMust = vertex.coveredRate.onlyMust
    const aggregateOnlyMust = vertex.aggregateRate.onlyMust
    const coveredMustAndShould = vertex.coveredRate.mustAndShould
    const aggregateMustAndShould = vertex.aggregateRate.mustAndShould
    const coveredOnlyShould = vertex.coveredRate.onlyShould
    const aggregateOnlyShould = vertex.aggregateRate.onlyShould
    const coveredOnlyMay = vertex.coveredRate.onlyMay
    const aggregateOnlyMay = vertex.aggregateRate.onlyMay
    dataForVertexId.set(vertex.id, {
      code: vertex.code,
      level: levelForId.get(vertex.id) ?? 0,
      hasParents: (parentsIds?.size ?? 0) > 0,
      hasChildren: (childIds?.size ?? 0) > 0,
      atomicityFlag: vertex.atomic,
      atomicityCoef: vertex.rate,
      modifier: vertex.modifier,
      fullCoverageFraction: `${coveredFull} / ${aggregateFull}`,
      onlyMustCoverageFraction: `${coveredOnlyMust} / ${aggregateOnlyMust}`,
      mustAndShouldCoverageFraction: `${coveredMustAndShould} / ${aggregateMustAndShould}`,
      onlyShouldCoverageFraction: `${coveredOnlyShould} / ${aggregateOnlyShould}`,
      onlyMayCoverageFraction: `${coveredOnlyMay} / ${aggregateOnlyMay}`,
      testId: vertex.testId
    })
  }

  return {
    vertexes,
    dataForVertexId
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
