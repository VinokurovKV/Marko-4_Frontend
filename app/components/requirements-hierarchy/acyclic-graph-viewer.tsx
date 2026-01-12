// Project
// import { AcyclicGraphVertexViewer } from './acyclic-graph-vertex-viewer'

interface Vertex {
  id: number
  childIds: number[]
  parentsIds: number[]
}

export interface AcyclicGraphViewerProps<VertexData> {
  vertexes: Vertex[]
  dataForVertexId: Map<number, VertexData>
  maxDisplayedLayerWhenWithoutSelected: number | null
  setMaxDisplayedLayerWhenWithoutSelected: React.Dispatch<
    React.SetStateAction<number | null>
  >
  /** default - false */
  fitOnSelectedIdChange?: boolean
  selectedId: number | null
  setSelectedId: React.Dispatch<React.SetStateAction<number | null>>
  onVertexClick?: (vertexId: number) => void
}

export function AcyclicGraphViewer<VertexData>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: AcyclicGraphViewerProps<VertexData>
) {
  return null
}
