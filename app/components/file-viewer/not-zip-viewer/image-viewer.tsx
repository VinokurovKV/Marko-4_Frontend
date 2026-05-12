// React
import * as React from 'react'

export const SUPPORTED_IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg'
] as const

export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml'
] as const

export type SupportedImageExtension =
  (typeof SUPPORTED_IMAGE_EXTENSIONS)[number]

interface ImageFileViewerProps {
  blob?: Blob | null
  fileName?: string
  isDarkMode?: boolean
}

export const ImageFileViewer: React.FC<ImageFileViewerProps> = ({
  blob,
  fileName,
  isDarkMode = false
}) => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const isSupportedImage = (blob: Blob, fileName?: string): boolean => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (blob.type && SUPPORTED_IMAGE_MIME_TYPES.includes(blob.type as any)) {
      return true
    }

    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (ext && SUPPORTED_IMAGE_EXTENSIONS.includes(ext as any)) {
        return true
      }
    }

    return false
  }

  React.useEffect(() => {
    if (!blob) {
      setImageUrl(null)
      setError(null)
      return
    }

    if (!isSupportedImage(blob, fileName)) {
      setError('Неподдерживаемый формат изображения')
      setImageUrl(null)
      return
    }

    const url = URL.createObjectURL(blob)
    setImageUrl(url)
    setError(null)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [blob, fileName])

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    minHeight: '200px',
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    borderRadius: '4px',
    overflow: 'hidden'
  }

  const imageStyles: React.CSSProperties = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  }

  const errorStyles: React.CSSProperties = {
    color: '#f44336',
    fontSize: '14px',
    textAlign: 'center'
  }

  const placeholderStyles: React.CSSProperties = {
    color: isDarkMode ? '#888888' : '#999999',
    fontSize: '14px',
    textAlign: 'center'
  }

  if (error) {
    return (
      <div style={containerStyles}>
        <div style={errorStyles}>{error}</div>
      </div>
    )
  }

  if (!blob) {
    return (
      <div style={containerStyles}>
        <div style={placeholderStyles}>Нет изображения</div>
      </div>
    )
  }

  if (!imageUrl) {
    return (
      <div style={containerStyles}>
        <div style={placeholderStyles}>Загрузка...</div>
      </div>
    )
  }

  return (
    <div style={containerStyles}>
      <img src={imageUrl} alt={fileName || 'Изображение'} style={imageStyles} />
    </div>
  )
}
