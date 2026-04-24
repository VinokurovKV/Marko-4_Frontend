import { type Node, type Edge, MarkerType } from 'reactflow'
import { type AcyclicGraphVertexViewerProps } from './acyclic-graph-vertex-viewer'
import { type Vertex } from './acyclic-graph-viewer'

interface SimpleRequirement {
  code: string
  parentCodes: string[]
  childCodes: string[]
}

const simpleRequirements: SimpleRequirement[] = [
  {
    code: 'item-bfs-8',
    parentCodes: ['tz-802.1q'],
    childCodes: ['item-bfs-8-st-fdb']
  },

  {
    code: 'item-bfs-8-st-entry',
    parentCodes: ['item-bfs-8-st-fdb'],
    childCodes: ['item-bfs-8-st-entry1']
  },

  {
    code: 'item-bfs-8-st-entry1',
    parentCodes: ['item-bfs-8-st-entry'],
    childCodes: []
  },

  {
    code: 'item-bfs-8-st-fdb',
    parentCodes: ['item-bfs-8'],
    childCodes: ['item-bfs-8-st-entry']
  },

  {
    code: 'item-vlan-1',
    parentCodes: ['tz-802.1q'],
    childCodes: ['vlan-1-acc-fr-type']
  },

  {
    code: 'tz-802.1q',
    parentCodes: [],
    childCodes: ['item-bfs-8', 'item-vlan-1']
  },

  {
    code: 'link_aggregation_tz_req',
    parentCodes: [],
    childCodes: [
      'link_aggregation_req_1',
      'link_aggregation_req_2',
      'link_aggregation_req_3',
      'link_aggregation_req_4',
      'link_aggregation_req_5',
      'link_aggregation_req_6'
    ]
  },

  {
    code: 'vlan-1-acc-fr-type',
    parentCodes: ['item-vlan-1'],
    childCodes: ['vlan-1-eiss-all', 'vlan-1-eiss-tag', 'vlan-1-eiss-untag']
  },

  {
    code: 'vlan-1-eiss-all',
    parentCodes: ['vlan-1-acc-fr-type'],
    childCodes: [
      'vlan-1-eiss-all.1',
      'vlan-1-eiss-all.2',
      'vlan-1-eiss-all.3',
      'vlan-1-eiss-all.4'
    ]
  },

  {
    code: 'vlan-1-eiss-all.1',
    parentCodes: ['vlan-1-eiss-all'],
    childCodes: []
  },

  {
    code: 'vlan-1-eiss-all.2',
    parentCodes: ['vlan-1-eiss-all'],
    childCodes: []
  },

  {
    code: 'vlan-1-eiss-all.3',
    parentCodes: ['vlan-1-eiss-all'],
    childCodes: []
  },

  {
    code: 'vlan-1-eiss-all.4',
    parentCodes: ['vlan-1-eiss-all'],
    childCodes: []
  },

  {
    code: 'vlan-1-eiss-tag',
    parentCodes: ['vlan-1-acc-fr-type'],
    childCodes: ['vlan-1-eiss-tag.1', 'vlan-1-eiss-tag.2', 'vlan-1-eiss-tag.3']
  },

  {
    code: 'vlan-1-eiss-tag.1',
    parentCodes: ['vlan-1-eiss-tag'],
    childCodes: []
  },

  {
    code: 'vlan-1-eiss-tag.2',
    parentCodes: ['vlan-1-eiss-tag'],
    childCodes: []
  },

  {
    code: 'vlan-1-eiss-tag.3',
    parentCodes: ['vlan-1-eiss-tag'],
    childCodes: []
  },

  {
    code: 'vlan-1-eiss-untag',
    parentCodes: ['vlan-1-acc-fr-type'],
    childCodes: [
      'vlan-1-eiss-untag.1',
      'vlan-1-eiss-untag.2',
      'vlan-1-eiss-untag.3'
    ]
  },

  {
    code: 'vlan-1-eiss-untag.1',
    parentCodes: ['vlan-1-eiss-untag'],
    childCodes: []
  },

  {
    code: 'vlan-1-eiss-untag.2',
    parentCodes: ['vlan-1-eiss-untag'],
    childCodes: []
  },

  {
    code: 'vlan-1-eiss-untag.3',
    parentCodes: ['vlan-1-eiss-untag'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_1',
    parentCodes: ['link_aggregation_tz_req'],
    childCodes: [
      'link_aggregation_req_1.1',
      'link_aggregation_req_1.2',
      'link_aggregation_req_1.3',
      'link_aggregation_req_1.4',
      'link_aggregation_req_1.5'
    ]
  },

  {
    code: 'link_aggregation_req_1.1',
    parentCodes: ['link_aggregation_req_1'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_1.2',
    parentCodes: ['link_aggregation_req_1'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_1.3',
    parentCodes: ['link_aggregation_req_1'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_1.4',
    parentCodes: ['link_aggregation_req_1'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_1.5',
    parentCodes: ['link_aggregation_req_1'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_2',
    parentCodes: ['link_aggregation_tz_req'],
    childCodes: [
      'link_aggregation_req_2.1',
      'link_aggregation_req_2.2',
      'link_aggregation_req_2.3',
      'link_aggregation_req_2.4',
      'link_aggregation_req_2.5',
      'link_aggregation_req_2.6',
      'link_aggregation_req_2.7',
      'link_aggregation_req_2.8',
      'link_aggregation_req_2.9',
      'link_aggregation_req_2.10'
    ]
  },

  {
    code: 'link_aggregation_req_2.1',
    parentCodes: ['link_aggregation_req_2'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_2.2',
    parentCodes: ['link_aggregation_req_2'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_2.3',
    parentCodes: ['link_aggregation_req_2'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_2.4',
    parentCodes: ['link_aggregation_req_2'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_2.5',
    parentCodes: ['link_aggregation_req_2'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_2.6',
    parentCodes: ['link_aggregation_req_2'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_2.7',
    parentCodes: ['link_aggregation_req_2'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_2.8',
    parentCodes: ['link_aggregation_req_2'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_2.9',
    parentCodes: ['link_aggregation_req_2'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_2.10',
    parentCodes: ['link_aggregation_req_2'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_3',
    parentCodes: ['link_aggregation_tz_req'],
    childCodes: [
      'link_aggregation_req_3.1',
      'link_aggregation_req_3.2',
      'link_aggregation_req_3.3',
      'link_aggregation_req_3.4',
      'link_aggregation_req_3.5',
      'link_aggregation_req_3.6',
      'link_aggregation_req_3.7',
      'link_aggregation_req_3.8',
      'link_aggregation_req_3.9'
    ]
  },

  {
    code: 'link_aggregation_req_3.1',
    parentCodes: ['link_aggregation_req_3'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_3.2',
    parentCodes: ['link_aggregation_req_3'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_3.3',
    parentCodes: ['link_aggregation_req_3'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_3.4',
    parentCodes: ['link_aggregation_req_3'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_3.5',
    parentCodes: ['link_aggregation_req_3'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_3.6',
    parentCodes: ['link_aggregation_req_3'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_3.7',
    parentCodes: ['link_aggregation_req_3'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_3.8',
    parentCodes: ['link_aggregation_req_3'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_3.9',
    parentCodes: ['link_aggregation_req_3'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_4',
    parentCodes: ['link_aggregation_tz_req'],
    childCodes: [
      'link_aggregation_req_4.1',
      'link_aggregation_req_4.2',
      'link_aggregation_req_4.3',
      'link_aggregation_req_4.4',
      'link_aggregation_req_4.5',
      'link_aggregation_req_4.6',
      'link_aggregation_req_4.7',
      'link_aggregation_req_4.8',
      'link_aggregation_req_4.9',
      'link_aggregation_req_4.10',
      'link_aggregation_req_4.11'
    ]
  },

  {
    code: 'link_aggregation_req_4.1',
    parentCodes: ['link_aggregation_req_4'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_4.2',
    parentCodes: ['link_aggregation_req_4'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_4.3',
    parentCodes: ['link_aggregation_req_4'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_4.4',
    parentCodes: ['link_aggregation_req_4'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_4.5',
    parentCodes: ['link_aggregation_req_4'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_4.6',
    parentCodes: ['link_aggregation_req_4'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_4.7',
    parentCodes: ['link_aggregation_req_4'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_4.8',
    parentCodes: ['link_aggregation_req_4'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_4.9',
    parentCodes: ['link_aggregation_req_4'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_4.10',
    parentCodes: ['link_aggregation_req_4'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_4.11',
    parentCodes: ['link_aggregation_req_4'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_5',
    parentCodes: ['link_aggregation_tz_req'],
    childCodes: [
      'link_aggregation_req_4.1',
      'link_aggregation_req_4.2',
      'link_aggregation_req_4.3'
    ]
  },

  {
    code: 'link_aggregation_req_5.1',
    parentCodes: ['link_aggregation_req_5'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_5.2',
    parentCodes: ['link_aggregation_req_5'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_5.3',
    parentCodes: ['link_aggregation_req_5'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6',
    parentCodes: ['link_aggregation_tz_req'],
    childCodes: [
      'link_aggregation_req_6.1',
      'link_aggregation_req_6.2',
      'link_aggregation_req_6.3',
      'link_aggregation_req_6.4',
      'link_aggregation_req_6.5',
      'link_aggregation_req_6.6',
      'link_aggregation_req_6.7',
      'link_aggregation_req_6.8',
      'link_aggregation_req_6.9',
      'link_aggregation_req_6.10',
      'link_aggregation_req_6.11',
      'link_aggregation_req_6.12',
      'link_aggregation_req_6.13',
      'link_aggregation_req_6.14'
    ]
  },

  {
    code: 'link_aggregation_req_6.1',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6.2',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6.3',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6.4',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6.5',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6.6',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6.7',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6.8',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6.9',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6.10',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6.11',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6.12',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6.13',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  },

  {
    code: 'link_aggregation_req_6.14',
    parentCodes: ['link_aggregation_req_6'],
    childCodes: []
  }
]

function convertToVertices(requirements: SimpleRequirement[]): Vertex[] {
  const codeToId = new Map<string, number>()
  const vertices: Vertex[] = []

  requirements.forEach((req, index) => {
    const id = index + 1
    codeToId.set(req.code, id)

    vertices.push({
      id,
      childIds: [],
      parentsIds: []
    })
  })

  requirements.forEach((req, index) => {
    const vertex = vertices[index]

    const parentIds = req.parentCodes
      .map((code) => codeToId.get(code))
      .filter((id): id is number => id !== undefined)

    const childIds = req.childCodes
      .map((code) => codeToId.get(code))
      .filter((id): id is number => id !== undefined)

    vertex.parentsIds = parentIds
    vertex.childIds = childIds
  })

  return vertices
}

export const vertexes: Vertex[] = convertToVertices(simpleRequirements)

export type RequirementVertexData = {
  code: string
  level: number
  hasParents: boolean
  hasChildren: boolean
}

export const dataForVertexId = new Map<number, RequirementVertexData>()

function initializeVertexData() {
  const levelCache = new Map<number, number>()

  function calculateLevel(vertexId: number): number {
    if (levelCache.has(vertexId)) return levelCache.get(vertexId)!

    const vertex = vertexes.find((v) => v.id === vertexId)
    if (!vertex) return 0

    if (vertex.parentsIds.length === 0) {
      levelCache.set(vertexId, 0)
      return 0
    }

    let maxParentLevel = 0
    for (const parentId of vertex.parentsIds) {
      const parentLevel = calculateLevel(parentId)
      if (parentLevel + 1 > maxParentLevel) {
        maxParentLevel = parentLevel + 1
      }
    }

    levelCache.set(vertexId, maxParentLevel)
    return maxParentLevel
  }

  vertexes.forEach((vertex) => {
    const reqIndex = vertex.id - 1
    const req = simpleRequirements[reqIndex]
    const level = calculateLevel(vertex.id)

    dataForVertexId.set(vertex.id, {
      code: req.code,
      level: level,
      hasParents: vertex.parentsIds.length > 0,
      hasChildren: vertex.childIds.length > 0
    })
  })
}

initializeVertexData()

export type AcyclicGraphNode = Node<
  AcyclicGraphVertexViewerProps<RequirementVertexData>
>

export function createAcyclicGraphNodes(): AcyclicGraphNode[] {
  const verticesByLevel = new Map<number, Vertex[]>()

  vertexes.forEach((vertex) => {
    const vertexData = dataForVertexId.get(vertex.id)
    const level = vertexData?.level ?? 0

    if (!verticesByLevel.has(level)) {
      verticesByLevel.set(level, [])
    }
    verticesByLevel.get(level)!.push(vertex)
  })

  const sortedLevels = Array.from(verticesByLevel.keys()).sort((a, b) => a - b)
  const levelHeight = 150
  const nodeWidth = 200
  const nodeSpacing = 50

  const nodes: AcyclicGraphNode[] = []

  sortedLevels.forEach((level, levelIndex) => {
    const verticesInLevel = verticesByLevel.get(level)!
    const totalWidth = verticesInLevel.length * (nodeWidth + nodeSpacing)
    const startX = -totalWidth / 2

    verticesInLevel.forEach((vertex, vertexIndex) => {
      const x = startX + vertexIndex * (nodeWidth + nodeSpacing) + nodeWidth / 2
      const y = levelIndex * levelHeight

      const vertexData = dataForVertexId.get(vertex.id)!

      nodes.push({
        id: vertex.id.toString(),
        type: 'acyclicGraphVertex',
        position: { x, y },
        data: {
          id: vertex.id,
          level: level,
          hasParents: vertex.parentsIds.length > 0,
          hasChildren: vertex.childIds.length > 0,
          data: vertexData,
          type: 'DEFAULT',
          collapsed: false
        }
      })
    })
  })

  return nodes
}

export function createAcyclicGraphEdges(): Edge[] {
  const edges: Edge[] = []

  vertexes.forEach((vertex) => {
    vertex.childIds.forEach((childId) => {
      edges.push({
        id: `${vertex.id}-${childId}`,
        source: vertex.id.toString(),
        target: childId.toString(),
        type: 'straight',
        animated: false
      })
    })
  })

  return edges
}

export const initialNodes = createAcyclicGraphNodes()
export const initialEdges = createAcyclicGraphEdges()

export const edgeStyle = {
  markerEnd: {
    type: 'arrowclosed' as MarkerType,
    strokeWidth: 5
  },
  style: {
    strokeWidth: 2
  }
}
