import { Handle, Position, type NodeProps } from 'reactflow'
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag'
import { useTheme } from '@mui/material/styles'
import { green, orange, red } from '~/theme/themePrimitives'
import './styles.css'

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
  fullCoverageFraction?: string
  onlyMustCoverageFraction?: string
  mustAndShouldCoverageFraction?: string
  onlyShouldCoverageFraction?: string
  onlyMayCoverageFraction?: string
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

function parseCoverageFractionPercent(
  fraction: string | undefined
): number | null {
  if (fraction === undefined) {
    return null
  }
  const [coveredRaw, totalRaw] = fraction.split('/').map((part) => part.trim())
  const covered = Number(coveredRaw)
  const total = Number(totalRaw)
  if (
    Number.isFinite(covered) === false ||
    Number.isFinite(total) === false ||
    total <= 0
  ) {
    return null
  }
  return (covered / total) * 100
}

export default function AcyclicGraphVertexViewer({
  data: {
    id,
    hasParents,
    hasChildren,
    data,
    type,
    dimmed = false,
    collapsed,
    onClick
  }
}: NodeProps<AcyclicGraphVertexViewerProps<VertexData>>) {
  const theme = useTheme()

  const coveragePercent = parseCoverageFractionPercent(
    data.fullCoverageFraction
  )
  const borderColor =
    coveragePercent === null
      ? 'hsl(220, 30%, 6%)'
      : coveragePercent === 0
        ? theme.palette.mode === 'dark'
          ? red[400]
          : red[500]
        : coveragePercent < 50
          ? theme.palette.mode === 'dark'
            ? orange[400]
            : orange[500]
          : coveragePercent < 100
            ? theme.palette.mode === 'dark'
              ? orange[300]
              : orange[300]
            : theme.palette.mode === 'dark'
              ? green[500]
              : green[400]

  const handleClick = () => {
    onClick?.(id)
  }

  return (
    <div
      className={`acyclic-vertex ${type.toLowerCase()} ${dimmed ? 'dimmed' : ''} ${collapsed ? 'collapsed' : ''}`}
      onClick={handleClick}
      style={{ borderColor, borderWidth: '3px' }}
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
      {data.atomicityFlag ? (
        <span className="atomic-indicator" title="Требование атомарно">
          <OutlinedFlagIcon sx={{ fontSize: 14 }} />
        </span>
      ) : null}

      <div className="vertex-code">{data.code}</div>

      {collapsed && <div className="collapsed-indicator">C</div>}
    </div>
  )
}
