import Button from '../base-components/button'

interface AreaButtonsContainerProps {
  coordinates: {
    xMin: number
    xMax: number
    yMin: number
    yMax: number
  }
  scale: number
  withUpdate: boolean
  withDelete: boolean
  currentAreaId: number
  handleUpdate: (areaId: number) => void
  handleDelete: (areaId: number) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  onAreaClick: (areaId: number) => void
}

export default function AreaButtonsContainer({
  coordinates,
  scale,
  withUpdate,
  withDelete,
  currentAreaId,
  handleUpdate,
  handleDelete,
  onMouseEnter,
  onMouseLeave,
  onAreaClick
}: AreaButtonsContainerProps) {
  const dynamicStyle = {
    left: `${coordinates.xMin * scale}px`,
    top: `${coordinates.yMin * scale}px`,
    width: `${(coordinates.xMax - coordinates.xMin) * scale}px`
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    // Проверяем, что наведение не на кнопку
    if (!(e.target as HTMLElement).closest('button')) {
      onMouseEnter()
    }
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Проверяем, что курсор покидает контейнер, а не переходит на кнопку
    if (!(e.relatedTarget as HTMLElement)?.closest('.area-buttons-container')) {
      onMouseLeave()
    }
  }

  const handleAreaClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAreaClick(currentAreaId)
  }

  return (
    <div
      className="area-buttons-container"
      style={dynamicStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleAreaClick}
    >
      {withUpdate && (
        <Button
          type="button"
          imageName="edit"
          onMouseClick={(e) => {
            e.stopPropagation()
            handleUpdate(currentAreaId)
          }}
        />
      )}
      {withDelete && (
        <Button
          type="button"
          imageName="delete"
          onMouseClick={(e) => {
            e.stopPropagation()
            handleDelete(currentAreaId)
          }}
        />
      )}
    </div>
  )
}
