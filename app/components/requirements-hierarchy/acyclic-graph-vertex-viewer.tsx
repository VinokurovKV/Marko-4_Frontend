export type AcyclicGraphVertexType =
  /** type for a case when selected vertex doesn't exist in a graph */
  | 'DEFAULT'
  /** types for a case when selected vertex exists in a graph */
  | 'SELECTED'
  | 'RELATED'
  | 'SECONDARY'

export interface AcyclicGraphVertexViewerProps<VertexData> {
  id: number
  level: number
  hasParents: boolean
  hasChildren: boolean
  data: VertexData
  type: AcyclicGraphVertexType
  collapsed: boolean
  onClick?: (id: number) => void
}

export function AcyclicGraphVertexViewer<VertexData>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: AcyclicGraphVertexViewerProps<VertexData>
) {
  return null
}
