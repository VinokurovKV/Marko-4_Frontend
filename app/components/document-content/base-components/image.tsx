interface ImageProps {
  imageName: string
}

export default function Image({ imageName }: ImageProps) {
  return <i className="material-icons">{imageName}</i>
}
