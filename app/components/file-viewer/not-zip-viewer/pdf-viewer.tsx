// React
import * as React from 'react'

interface PdfFileViewerProps {
  blob?: Blob | null
  fileName?: string
  isDarkMode?: boolean
}

export const PdfFileViewer: React.FC<PdfFileViewerProps> = ({
  blob,
  fileName,
  isDarkMode = false
}) => {
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setPdfUrl(null)
    }
  }, [blob])

  const containerStyles: React.CSSProperties = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    borderRadius: '8px',
    padding: '16px',
    width: '100%',
    height: '100%',
    minHeight: '500px'
  }

  if (!pdfUrl) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          Нет PDF файла для просмотра
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyles}>
      <object
        data={pdfUrl}
        type="application/pdf"
        style={{
          width: '100%',
          height: 'calc(100% - 60px)',
          minHeight: '500px',
          borderRadius: '4px'
        }}
      >
        <p style={{ textAlign: 'center' }}>
          Ваш браузер не может отобразить PDF.
          <a href={pdfUrl} download={fileName}>
            Скачать файл
          </a>
        </p>
      </object>
    </div>
  )
}
