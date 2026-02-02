import { useState, useEffect, useRef } from 'react'

interface ThumbnailProps {
  pageNumber: number
  pdfFile: { data: ArrayBuffer }
  isSelected: boolean
  width: number
  onClick: (pageNumber: number) => void
}

export default function Thumbnail({
  pageNumber,
  pdfFile,
  isSelected,
  width,
  onClick
}: ThumbnailProps) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [PageComponent, setPageComponent] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [DocumentComponent, setDocumentComponent] = useState<any>(null)
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scale, setScale] = useState<number>(1.5)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      void import('react-pdf').then((module) => {
        setPageComponent(() => module.Page)
        setDocumentComponent(() => module.Document)
      })
    }
  }, [])

  useEffect(() => {
    if (pdfFile.data) {
      const copy = pdfFile.data.slice(0)
      setFileData(copy)
    }
  }, [pdfFile.data])

  const calculateHeight = () => {
    return width * 1.414
  }

  if (!PageComponent || !DocumentComponent || !fileData) {
    return (
      <div
        className={`thumbnail ${isSelected ? 'thumbnail-selected' : ''}`}
        onClick={() => onClick(pageNumber)}
        style={{ width: `${width}px`, height: `${calculateHeight()}px` }}
      >
        <div className="thumbnail-placeholder">Загрузка...</div>
        <div className="thumbnail-page-number">{pageNumber}</div>
      </div>
    )
  }

  return (
    <div className="thumbnail-wrapper">
      <div
        ref={containerRef}
        className={`thumbnail ${isSelected ? 'thumbnail-selected' : ''}`}
        onClick={() => onClick(pageNumber)}
        style={{ width: `${width}px`, height: `${calculateHeight()}px` }}
      >
        <DocumentComponent
          file={{ data: fileData }}
          loading={<div>Загрузка PDF...</div>}
        >
          <PageComponent
            pageNumber={pageNumber}
            width={width}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={<div>Загрузка страницы...</div>}
          />
        </DocumentComponent>
      </div>
      <div className="thumbnail-page-number">{pageNumber}</div>
    </div>
  )
}
