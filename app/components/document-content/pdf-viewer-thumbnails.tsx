// React
import React from 'react'
// EmbedPDF
import { ThumbnailsPane, ThumbImg } from '@embedpdf/plugin-thumbnail/react'
import { useScroll } from '@embedpdf/plugin-scroll/react'

type RectangleLike = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

type PdfAreaLike = {
  id: number
  name: string
  pageIndex: number
  localRect: RectangleLike
}

type PageSize = {
  width: number
  height: number
}

type PdfThumbnailMeta = {
  pageIndex: number
  top: number
  wrapperHeight: number
  width: number
  height: number
}

export type PdfViewerThumbnailsProps = {
  documentId: string
  currentPageIndex: number | null
  areas: PdfAreaLike[]
  activeAreaId: number | null
  pageSizes: PageSize[]
}

export const PdfViewerThumbnails: React.FC<PdfViewerThumbnailsProps> = ({
  documentId,
  currentPageIndex,
  areas,
  activeAreaId,
  pageSizes
}) => {
  const { provides: scroll } = useScroll(documentId)

  return (
    <div className="pdfv-thumbs">
      <ThumbnailsPane documentId={documentId}>
        {(m: PdfThumbnailMeta) => {
          const top = Math.round(m.top)
          const wrapperHeight = Math.round(m.wrapperHeight)
          const width = Math.round(m.width)
          const height = Math.round(m.height)

          const isActive = currentPageIndex === m.pageIndex
          const thumbAreas = areas.filter((a) => a.pageIndex === m.pageIndex)

          const pageSize = pageSizes[m.pageIndex]
          if (!pageSize) return null

          const pageWidth = pageSize.width
          const pageHeight = pageSize.height

          return (
            <div
              key={m.pageIndex}
              className="pdfv-thumb-item"
              style={{
                top,
                height: wrapperHeight
              }}
              onClick={() =>
                scroll?.scrollToPage({ pageNumber: m.pageIndex + 1 })
              }
            >
              <div className="pdfv-thumb-image-wrap" style={{ width, height }}>
                <ThumbImg
                  documentId={documentId}
                  meta={m as React.ComponentProps<typeof ThumbImg>['meta']}
                />

                <div className="pdfv-thumb-overlay">
                  {thumbAreas.map((a) => {
                    const left = (a.localRect.xMin / pageWidth) * width
                    const top = (a.localRect.yMin / pageHeight) * height
                    const rectWidth =
                      ((a.localRect.xMax - a.localRect.xMin) / pageWidth) *
                      width
                    const rectHeight =
                      ((a.localRect.yMax - a.localRect.yMin) / pageHeight) *
                      height

                    const isAreaActive = activeAreaId === a.id

                    return (
                      <div
                        key={a.id}
                        className={
                          isAreaActive
                            ? 'pdfv-thumb-area pdfv-thumb-area--active'
                            : 'pdfv-thumb-area'
                        }
                        style={{
                          left,
                          top,
                          width: Math.max(rectWidth, 2),
                          height: Math.max(rectHeight, 2)
                        }}
                        title={a.name}
                      />
                    )
                  })}
                </div>
              </div>

              <div
                className={
                  isActive
                    ? 'pdfv-thumb-label pdfv-thumb-label--active'
                    : 'pdfv-thumb-label'
                }
              >
                {m.pageIndex + 1}
              </div>
            </div>
          )
        }}
      </ThumbnailsPane>
    </div>
  )
}
