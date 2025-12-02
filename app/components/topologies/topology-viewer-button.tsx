interface ImageProps {
  imageName: string
}

function Image({ imageName }: ImageProps) {
  return <i className="material-icons">{imageName}</i>
}

interface ButtonProps {
  type: 'button' | 'submit' | 'reset'
  text?: string
  imageName?: string
  dataAction?: string
  className?: string
  disabled?: boolean
  onClick?: () => void
}

export function TopologyViewerButton({
  type,
  text,
  imageName,
  dataAction,
  className,
  disabled,
  onClick
}: ButtonProps) {
  return (
    <button
      type={type}
      data-action={dataAction}
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {text}
      {imageName && <Image imageName={imageName} />}
    </button>
  )
}
