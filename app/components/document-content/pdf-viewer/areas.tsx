import { type CSSProperties } from 'react'
import { type PdfViewerMode } from './pdf-viewer'
import { type Rectangle } from './pdf-viewer'

export interface BaseSizes {
  x: number
  y: number
}

interface TemporaryAreaProps {
  coordinates: Rectangle
  scale: number
}

interface AreaProps extends TemporaryAreaProps {
  currentMode: PdfViewerMode
  currentAreaId: number
  isHovered: boolean
}

interface AreaNameProps {
  coordinates: BaseSizes
  areaSize: BaseSizes
  scale: number
  currentAreaName: string
}

export function AreaName({
  coordinates,
  areaSize,
  scale,
  currentAreaName
}: AreaNameProps) {
  const areaScale = Math.min(areaSize.x, areaSize.y) / 150
  const dynamicStyle = {
    left: `${coordinates.x * scale + 5}px`,
    top: `${coordinates.y * scale + 5}px`,
    fontSize: `${12 * areaScale}px`,
    padding: `${2 * areaScale}px ${4 * areaScale}px`,
    borderRadius: `${2 * areaScale}px`
  }

  return (
    <div className="area-name" style={dynamicStyle}>
      {currentAreaName}
    </div>
  )
}

export function TemporaryArea({ coordinates, scale }: TemporaryAreaProps) {
  const dynamicStyle = {
    left: `${coordinates.xMin * scale}px`,
    top: `${coordinates.yMin * scale}px`,
    width: `${(coordinates.xMax - coordinates.xMin) * scale}px`,
    height: `${(coordinates.yMax - coordinates.yMin) * scale}px`
  }

  return <div className="temporary-area" style={dynamicStyle} />
}

export default function Area({
  coordinates,
  scale,
  currentMode,
  currentAreaId,
  isHovered
}: AreaProps) {
  const dynamicStyle = {
    left: `${coordinates.xMin * scale}px`,
    top: `${coordinates.yMin * scale}px`,
    width: `${(coordinates.xMax - coordinates.xMin) * scale}px`,
    height: `${(coordinates.yMax - coordinates.yMin) * scale}px`
  }
  const isSelected: boolean =
    currentMode.type === 'BROWSE_AREA' && currentMode.areaId === currentAreaId
  let backgroundColor: string = 'rgba(255, 0, 0, 0.1)'
  let cursor: string = 'default'
  const hoveredFlag: boolean =
    currentMode.type !== 'UPDATE_AREA_RECTANGLE' ? true : false
  if ((isHovered || isSelected) && hoveredFlag) {
    backgroundColor = 'rgba(255, 255, 0, 0.1)'
    cursor = 'pointer'
  }
  const areaStyle: CSSProperties = {
    backgroundColor,
    cursor,
    pointerEvents: 'none',
    ...dynamicStyle
  }

  return <div className="area" style={areaStyle} />
}
