import { Handle, Position, type NodeProps } from 'reactflow'
// import styles from './styles.css'
import './styles.css'

/* eslint-disable */

export interface RectangleProps {
  index: string
  requirementCoverageAll: string
  requirementCoverageMust: string
  color: string
  nodesInLevel: number
  width: number
  height: number
  level: number
  className?: string
}

const rectangleColor = {
  red: 'rgba(255, 0, 0, 0.5)',
  orange: 'rgba(255, 165, 0, 0.5)',
  yellow: 'rgba(255, 255, 0, 0.5)',
  green: 'rgba(0, 255, 0, 0.5)'
}

export const getColorByCoverage = (coverage: string): string => {
  const [numerator, denominator] = coverage.split('/').map(Number)
  if (denominator === 0 || numerator > denominator) return rectangleColor.green
  const percentage = (numerator / denominator) * 100
  if (percentage === 0) return rectangleColor.red
  else if (percentage > 0 && percentage < 50) return rectangleColor.orange
  else if (percentage >= 50 && percentage < 100) return rectangleColor.yellow
  else return rectangleColor.green
}

export default function Rectangle({
  data: {
    index,
    requirementCoverageAll,
    requirementCoverageMust,
    nodesInLevel,
    width,
    height,
    className
  }
}: NodeProps<RectangleProps>) {
  const backgroundColor = getColorByCoverage(requirementCoverageMust)

  return (
    <div
      className={`rectangle ${className || ''}`}
      style={{
        backgroundColor,
        width: `${width}px`,
        height: `${height}px`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="rectangle-content">
        <span>№{index}</span>
        <span>Всего: {requirementCoverageAll}</span>
        <span>Должен: {requirementCoverageMust}</span>
      </div>
    </div>
  )
}

/* eslint-enable */
