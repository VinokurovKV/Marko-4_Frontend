import Image from './image'

interface ButtonProps {
  type: 'button' | 'submit' | 'reset'
  text?: string
  imageName?: string
  dataAction?: string
  className?: string
  disabled?: boolean
  onClick?: () => void
  onMouseClick?: (e: React.MouseEvent) => void
}

export default function Button({
  type,
  text,
  imageName,
  dataAction,
  className,
  disabled,
  onClick,
  onMouseClick
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onMouseClick) {
      onMouseClick(e)
    } else if (onClick) {
      onClick()
    }
  }

  return (
    <button
      type={type}
      data-action={dataAction}
      className={className}
      disabled={disabled}
      onClick={handleClick}
    >
      {text}
      {imageName && <Image imageName={imageName} />}
    </button>
  )
}
