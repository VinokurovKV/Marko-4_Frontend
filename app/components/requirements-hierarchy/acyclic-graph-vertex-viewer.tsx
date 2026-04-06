import { Handle, Position, type NodeProps } from 'reactflow'
import './styles.css'
import { useState } from 'react'

export type AcyclicGraphVertexType =
  | 'DEFAULT'
  | 'SELECTED'
  | 'RELATED'
  | 'SECONDARY'

export interface VertexData {
  code: string
  atomicityFlag: boolean
  atomicityCoef: number
  modifier: string
  origin: string
  coverage: number
  test: string
}

export interface AcyclicGraphVertexViewerProps<VertexData> {
  id: number
  level: number
  hasParents: boolean
  hasChildren: boolean
  data: VertexData
  type: AcyclicGraphVertexType
  dimmed?: boolean
  collapsed: boolean
  onClick?: (id: number) => void
}

export default function AcyclicGraphVertexViewer({
  data: {
    id,
    level,
    hasParents,
    hasChildren,
    data,
    type,
    dimmed = false,
    collapsed,
    onClick
  }
}: NodeProps<AcyclicGraphVertexViewerProps<VertexData>>) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    onClick?.(id)
  }

  return (
    <div
      className={`acyclic-vertex ${type.toLowerCase()} ${dimmed ? 'dimmed' : ''} ${collapsed ? 'collapsed' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {hasParents && (
        <Handle
          type="target"
          position={Position.Top}
          className="vertex-handle"
        />
      )}

      {hasChildren && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="vertex-handle"
        />
      )}

      <div className="vertex-code">
        {data.code}
        {isHovered && (
          <div className="vertex-tooltip">
            <div>ID: {id}</div>
            <div>Level: {level}</div>
            <div>Coverage: {data.coverage}%</div>
          </div>
        )}
      </div>

      {collapsed && <div className="collapsed-indicator">C</div>}
    </div>
  )
}
