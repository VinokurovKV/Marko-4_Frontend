import { type BaseSizes } from './areas'
import Image from '../base-components/image'

interface ResizeHandlerProps {
  className: string
  coordinates: BaseSizes
  areaSize: BaseSizes
  scale: number
  onMouseDown: (e: React.MouseEvent) => void
}

export default function ResizeHandler({
  className,
  onMouseDown,
  coordinates,
  areaSize,
  scale
}: ResizeHandlerProps) {
  const areaScale = Math.min(areaSize.x, areaSize.y) / 150
  const dynamicStyle = {
    left: `${coordinates.x * scale - 2 * scale}px`,
    top: `${coordinates.y * scale - 2 * scale}px`,
    width: `${areaScale * 5}px`,
    height: `${areaScale * 5}px`
  }

  const getIconName = () => {
    switch (className) {
      case 'bottom-right':
      case 'top-left':
        return 'open_with'
      case 'center':
        return 'pan_tool'
      default:
        return 'open_with'
    }
  }

  return (
    <div
      className={`resize-handle ${className}`}
      style={dynamicStyle}
      onMouseDown={onMouseDown}
    >
      <Image imageName={getIconName()} />
    </div>
  )
}
