import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import AreaButtonsContainer from './area-buttons-container'
import Area, { AreaName, TemporaryArea } from './areas'
import ResizeHandler from './resize-handler'
import './styles.css'

//TODO: переключение страниц, разобраться с ArrayBuffer, добавить функционала оставшимся кнопкам

// pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs'
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const MIN_AREA_HEIGHT = 20
const MIN_AREA_WIDTH = 60

export interface Rectangle {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  minPage: number
  maxPage: number
}

export interface PdfArea {
  id: number
  name: string
  rectangle: Rectangle
}

export type PdfViewerMode =
  | {
      type: 'DEFAULT'
    }
  | {
      type: 'BROWSE_AREA'
      areaId: number
    }
  | {
      type: 'CREATE_RECTANGLE'
    }
  | {
      type: 'UPDATE_AREA_RECTANGLE'
      areaId: number
    }

export type PdfViewerProps = {
  data: ArrayBuffer
  areas: PdfArea[]
  clickableAreas: boolean
  withUpdateAreaButtons: boolean
  withDeleteAreaButtons: boolean
  mode: PdfViewerMode
  onAreaClick?: (data: { areaId: number }) => void | null
  onUpdateAreaButtonClick?: (data: { areaId: number }) => void | null
  onDeleteAreaButtonClick?: (data: { areaId: number }) => void | null
  onCreateRectangle?: (data: { rectangle: Rectangle }) => void | null
  onCreateRectangleCancel?: () => void | null
  onUpdateAreaRectangle?: (data: {
    areaId: number
    rectangle: Rectangle
  }) => void | null
  onUpdateAreaRectangleCancel?: () => void | null
}

export const PdfViewer = ({
  data,
  areas,
  clickableAreas,
  withUpdateAreaButtons,
  withDeleteAreaButtons,
  mode,
  onAreaClick,
  onUpdateAreaButtonClick,
  onDeleteAreaButtonClick,
  onCreateRectangle,
  onCreateRectangleCancel,
  onUpdateAreaRectangle,
  onUpdateAreaRectangleCancel
}: PdfViewerProps) => {
  const fileData = useMemo(() => data.slice(0), [data])
  const file = useMemo(() => ({ data: fileData }), [fileData])

  const [numPages, setNumPages] = useState<number | null>(null)
  const [scale, setScale] = useState<number>(1)
  const [startX, setStartX] = useState<number | null>(null)
  const [startY, setStartY] = useState<number | null>(null)
  const [isResizing, setIsResizing] = useState<boolean>(false)
  const [resizingArea, setResizingArea] = useState<PdfArea | null>(null)
  const [tempRect, setTempRect] = useState<Rectangle | null>(null)
  const [justCreatedRectangle, setJustCreatedRectangle] =
    useState<boolean>(false)
  const [resizeHandleType, setResizeHandleType] = useState<
    'bottom-right' | 'top-left' | 'center' | null
  >(null)
  const [startPoint, setStartPoint] = useState<{
    x: number
    y: number
    page: number
  } | null>(null)
  const [pageHeights, setPageHeights] = useState<number[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pageOffsets, setPageOffsets] = useState<number[]>([])
  const [hoveredAreaId, setHoveredAreaId] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageContainerRef = useRef<HTMLDivElement>(null)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const handleAreaClick = (areaId: number) => {
    if (onAreaClick) {
      onAreaClick({ areaId })
    }
  }

  const handleUpdateAreaButtonClick = (areaId: number) => {
    if (onUpdateAreaButtonClick) {
      onUpdateAreaButtonClick({ areaId })
    }
  }

  const handleDeleteAreaButtonClick = (areaId: number) => {
    if (onDeleteAreaButtonClick) {
      onDeleteAreaButtonClick({ areaId })
    }
  }

  const handleMouseDown = (e: React.MouseEvent, pageNumber: number) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('.resize-handle')) return

    if (mode.type === 'CREATE_RECTANGLE') {
      e.preventDefault()
      const containerRect = containerRef.current?.getBoundingClientRect()
      const pageElement = e.currentTarget as HTMLElement
      const pageRect = pageElement.getBoundingClientRect()
      if (!containerRect || !pageRect) return

      const x = e.clientX - pageRect.left
      const y = e.clientY - pageRect.top

      setStartX(x)
      setStartY(y)
      setStartPoint({ x, y: y, page: pageNumber })
      setIsResizing(false)
      setTempRect({
        xMin: x / scale,
        xMax: x / scale,
        yMin: y / scale,
        yMax: y / scale,
        minPage: pageNumber,
        maxPage: pageNumber
      })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isResizing && tempRect && resizingArea && onUpdateAreaRectangle) {
      const normalizedRect = {
        xMin: Math.min(tempRect.xMin, tempRect.xMax),
        xMax: Math.max(tempRect.xMin, tempRect.xMax),
        yMin: Math.min(tempRect.yMin, tempRect.yMax),
        yMax: Math.max(tempRect.yMin, tempRect.yMax),
        minPage: resizingArea.rectangle.minPage,
        maxPage: resizingArea.rectangle.maxPage
      }
      const width = (normalizedRect.xMax - normalizedRect.xMin) * scale
      const height = (normalizedRect.yMax - normalizedRect.yMin) * scale

      if (width >= MIN_AREA_WIDTH && height >= MIN_AREA_HEIGHT) {
        onUpdateAreaRectangle({
          areaId: resizingArea.id,
          rectangle: normalizedRect
        })
      }
    } else if (
      mode.type === 'CREATE_RECTANGLE' &&
      tempRect &&
      onCreateRectangle &&
      startPoint
    ) {
      const normalizedRect = {
        xMin: Math.min(tempRect.xMin, tempRect.xMax),
        xMax: Math.max(tempRect.xMin, tempRect.xMax),
        yMin: Math.min(tempRect.yMin, tempRect.yMax),
        yMax: Math.max(tempRect.yMin, tempRect.yMax),
        minPage: tempRect.minPage,
        maxPage: tempRect.maxPage
      }

      if (normalizedRect.minPage !== normalizedRect.maxPage) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const firstPageHeight = pageHeights[normalizedRect.minPage - 1] || 0
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const lastPageHeight = pageHeights[normalizedRect.maxPage - 1] || 0
      }

      if (normalizedRect.minPage > 1) {
        normalizedRect.yMin = 0
      }

      if (normalizedRect.maxPage > normalizedRect.minPage) {
        let cumulativeHeight = 0
        for (let i = normalizedRect.minPage; i < normalizedRect.maxPage; i++) {
          cumulativeHeight += pageHeights[i - 1] || 0
        }
        normalizedRect.yMax -= cumulativeHeight
      }
      const width = (normalizedRect.xMax - normalizedRect.xMin) * scale
      const height = (normalizedRect.yMax - normalizedRect.yMin) * scale
      const isMultiPage = normalizedRect.maxPage > normalizedRect.minPage

      if (
        width >= MIN_AREA_WIDTH &&
        (isMultiPage || height >= MIN_AREA_HEIGHT)
      ) {
        onCreateRectangle({ rectangle: normalizedRect })
      }
    }

    setIsResizing(false)
    setResizingArea(null)
    setStartX(null)
    setStartY(null)
    setTempRect(null)
    setStartPoint(null)
    setJustCreatedRectangle(true)
  }

  const handleMouseMove = (e: React.MouseEvent, pageNumber: number) => {
    if (isResizing && resizingArea && startX !== null && startY !== null) {
      const deltaX = (e.clientX - startX) / scale
      const deltaY = (e.clientY - startY) / scale

      if (resizeHandleType === 'bottom-right') {
        const newXMax = resizingArea.rectangle.xMax + deltaX
        const newYMax = resizingArea.rectangle.yMax + deltaY
        const newWidth = newXMax - resizingArea.rectangle.xMin
        const newHeight = newYMax - resizingArea.rectangle.yMin

        if (
          newWidth < MIN_AREA_WIDTH / scale ||
          newHeight < MIN_AREA_HEIGHT / scale
        ) {
          return
        }

        setTempRect({
          xMin: resizingArea.rectangle.xMin,
          yMin: resizingArea.rectangle.yMin,
          xMax: resizingArea.rectangle.xMax + deltaX,
          yMax: resizingArea.rectangle.yMax + deltaY,
          minPage: resizingArea.rectangle.minPage,
          maxPage: resizingArea.rectangle.maxPage
        })
      } else if (resizeHandleType === 'top-left') {
        const newXMax = resizingArea.rectangle.xMax + deltaX
        const newYMax = resizingArea.rectangle.yMax + deltaY
        const newWidth = newXMax - resizingArea.rectangle.xMin
        const newHeight = newYMax - resizingArea.rectangle.yMin

        if (
          newWidth < MIN_AREA_WIDTH / scale ||
          newHeight < MIN_AREA_HEIGHT / scale
        ) {
          return
        }

        setTempRect({
          xMin: resizingArea.rectangle.xMin + deltaX,
          yMin: resizingArea.rectangle.yMin + deltaY,
          xMax: resizingArea.rectangle.xMax,
          yMax: resizingArea.rectangle.yMax,
          minPage: resizingArea.rectangle.minPage,
          maxPage: resizingArea.rectangle.maxPage
        })
      } else if (resizeHandleType === 'center') {
        setTempRect({
          xMin: resizingArea.rectangle.xMin + deltaX,
          xMax: resizingArea.rectangle.xMax + deltaX,
          yMin: resizingArea.rectangle.yMin + deltaY,
          yMax: resizingArea.rectangle.yMax + deltaY,
          minPage: resizingArea.rectangle.minPage,
          maxPage: resizingArea.rectangle.maxPage
        })
      }
    } else if (
      mode.type === 'CREATE_RECTANGLE' &&
      startX !== null &&
      startY !== null &&
      startPoint
    ) {
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      const currentX = (e.clientX - containerRect.left) / scale
      const currentY = e.clientY - containerRect.top

      const absoluteCurrentY = currentY
      const absoluteCurrentYScaled = absoluteCurrentY / scale

      const minPage = Math.min(startPoint.page, pageNumber)
      const maxPage = Math.max(startPoint.page, pageNumber)

      const newXMin = Math.min(startPoint.x / scale, currentX)
      const newXMax = Math.max(startPoint.x / scale, currentX)
      const newYMin = Math.min(startPoint.y / scale, absoluteCurrentYScaled)
      const newYMax = Math.max(startPoint.y / scale, absoluteCurrentYScaled)

      const newWidth = newXMax - newXMin
      const newHeight = newYMax - newYMin

      if (
        newWidth < MIN_AREA_WIDTH / scale ||
        newHeight < MIN_AREA_HEIGHT / scale
      ) {
        return
      }

      setTempRect({
        xMin: Math.min(startPoint.x / scale, currentX),
        xMax: Math.max(startPoint.x / scale, currentX),
        yMin: Math.min(startPoint.y / scale, absoluteCurrentYScaled),
        yMax: Math.max(startPoint.y / scale, absoluteCurrentYScaled),
        minPage,
        maxPage
      })
    }
  }

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    area: PdfArea,
    handleType: 'bottom-right' | 'top-left' | 'center'
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingArea(area)
    setIsResizing(true)
    setResizeHandleType(handleType)
    setStartX(e.clientX)
    setStartY(e.clientY)
    setTempRect(area.rectangle)
  }

  const handleDocumentClick = (e: React.MouseEvent) => {
    if (justCreatedRectangle) {
      e.stopPropagation()
      return
    }

    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('.resize-handle')) {
      return
    }

    if (!clickableAreas || mode.type === 'CREATE_RECTANGLE' || isResizing)
      return

    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    const x = (e.clientX - containerRect.left) / scale
    const y = (e.clientY - containerRect.top) / scale

    const clickedArea = areas.find((area) => {
      let cumulativeHeight = 0
      let clickedPage = 1
      for (let i = 0; i < pageHeights.length; i++) {
        cumulativeHeight += pageHeights[i]
        if (y * scale < cumulativeHeight) {
          clickedPage = i + 1
          break
        }
      }

      let localY = y * scale
      for (let i = 0; i < clickedPage - 1; i++) {
        localY -= pageHeights[i] || 0
      }
      localY /= scale

      return (
        clickedPage >= area.rectangle.minPage &&
        clickedPage <= area.rectangle.maxPage &&
        x >= area.rectangle.xMin &&
        x <= area.rectangle.xMax &&
        localY >= area.rectangle.yMin &&
        localY <= area.rectangle.yMax
      )
    })

    if (clickedArea) {
      handleAreaClick(clickedArea.id)
      e.preventDefault()
      e.stopPropagation()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode.type === 'CREATE_RECTANGLE' && (startX !== null || tempRect)) {
          if (onCreateRectangleCancel) {
            onCreateRectangleCancel()
          }
          setIsResizing(false)
          setResizingArea(null)
          setStartX(null)
          setStartY(null)
          setTempRect(null)
          setStartPoint(null)
          e.preventDefault()
        } else if (
          mode.type === 'UPDATE_AREA_RECTANGLE' &&
          onUpdateAreaRectangleCancel
        ) {
          onUpdateAreaRectangleCancel()
          setIsResizing(false)
          setResizingArea(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    mode.type,
    startX,
    tempRect,
    onCreateRectangleCancel,
    onUpdateAreaRectangleCancel
  ])

  useEffect(() => {
    if (justCreatedRectangle) {
      const timer = setTimeout(() => {
        setJustCreatedRectangle(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [justCreatedRectangle])

  useEffect(() => {
    if (containerRef.current && pageContainerRef.current) {
      const containerWidth = containerRef.current.clientWidth
      const pageWidth = pageContainerRef.current.clientWidth
      setScale(containerWidth / pageWidth)
    }
  }, [containerRef.current, pageContainerRef.current])

  const onPageLoadSuccess =
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (pageNumber: number) => (page: { originalHeight: number }) => {
      if (!containerRef) return
      const canvas = containerRef.current?.querySelector(
        `.react-pdf__Page[data-page-number="${pageNumber}"] .react-pdf__Page__canvas`
      ) as HTMLCanvasElement
      if (canvas) {
        setPageHeights((prevHeights) => {
          const newHeights = [...prevHeights]
          newHeights[pageNumber - 1] = canvas.clientHeight
          return newHeights
        })
      }
    }

  useEffect(() => {
    if (!pageContainerRef.current) return

    const pages = pageContainerRef.current.querySelectorAll(
      '.react-pdf__Page__canvas'
    )
    const observer = new ResizeObserver((entries) => {
      const heights = Array.from(entries).map(
        (entry) => entry.contentRect.height
      )
      setPageHeights(heights)
    })

    pages.forEach((page) => observer.observe(page))

    return () => observer.disconnect()
  }, [numPages, scale])

  useEffect(() => {
    const offsets = []
    let cumulativeOffset = 0
    for (let i = 0; i < pageHeights.length; i++) {
      offsets.push(cumulativeOffset)
      cumulativeOffset += pageHeights[i]
    }
    setPageOffsets(offsets)
  }, [pageHeights])

  return (
    <div ref={containerRef} className="document-container">
      <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
        <div ref={pageContainerRef} className="page-container">
          {Array.from(new Array(numPages || 0), (_, index) => {
            const pageNumber: number = index + 1
            const pageAreas: PdfArea[] = areas.filter(
              (area) =>
                pageNumber >= area.rectangle.minPage &&
                pageNumber <= area.rectangle.maxPage
            )

            return (
              <div
                key={`page-${pageNumber}`}
                className="page-frame"
                data-page={pageNumber}
                onMouseDown={(e) => handleMouseDown(e, pageNumber)}
                onMouseMove={(e) => handleMouseMove(e, pageNumber)}
                onMouseUp={handleMouseUp}
                onClick={handleDocumentClick}
              >
                <Page
                  pageNumber={pageNumber}
                  renderTextLayer={true}
                  width={
                    containerRef.current
                      ? containerRef.current.clientWidth * 0.8
                      : undefined
                  }
                  onLoadSuccess={onPageLoadSuccess(pageNumber)}
                />
                {clickableAreas &&
                  mode.type !== 'CREATE_RECTANGLE' &&
                  !isResizing && <div className="document-click-layer" />}
                <div className="visual-layer">
                  {pageAreas.map((area) => {
                    const currentRect =
                      tempRect && resizingArea?.id === area.id
                        ? tempRect
                        : area.rectangle

                    let relativeYMin = currentRect.yMin
                    let relativeYMax = currentRect.yMax

                    if (pageNumber > currentRect.minPage) {
                      relativeYMin = 0
                    }

                    if (pageNumber < currentRect.maxPage) {
                      relativeYMax = pageHeights[pageNumber - 1] || 0
                    } else if (
                      pageNumber === currentRect.maxPage &&
                      currentRect.minPage !== currentRect.maxPage
                    ) {
                      relativeYMax = currentRect.yMax
                    }

                    return (
                      <React.Fragment key={area.id}>
                        <Area
                          coordinates={{
                            xMin: currentRect.xMin,
                            xMax: currentRect.xMax,
                            yMin: relativeYMin,
                            yMax: relativeYMax,
                            minPage: currentRect.minPage,
                            maxPage: currentRect.maxPage
                          }}
                          scale={scale}
                          currentMode={mode}
                          currentAreaId={area.id}
                          isHovered={hoveredAreaId === area.id}
                        />
                        {mode.type === 'UPDATE_AREA_RECTANGLE' &&
                          mode.areaId === area.id && (
                            <>
                              {pageNumber === area.rectangle.maxPage && (
                                <ResizeHandler
                                  className="bottom-right"
                                  coordinates={{
                                    x: currentRect.xMax,
                                    y: relativeYMax
                                  }}
                                  areaSize={{
                                    x:
                                      (currentRect.xMax - currentRect.xMin) *
                                      scale,
                                    y: (relativeYMax - relativeYMin) * scale
                                  }}
                                  scale={scale}
                                  onMouseDown={(e) =>
                                    handleResizeMouseDown(
                                      e,
                                      area,
                                      'bottom-right'
                                    )
                                  }
                                />
                              )}
                              {pageNumber == area.rectangle.minPage && (
                                <ResizeHandler
                                  className="top-left"
                                  coordinates={{
                                    x: currentRect.xMin,
                                    y: relativeYMin
                                  }}
                                  areaSize={{
                                    x:
                                      (currentRect.xMax - currentRect.xMin) *
                                      scale,
                                    y: (relativeYMax - relativeYMin) * scale
                                  }}
                                  scale={scale}
                                  onMouseDown={(e) =>
                                    handleResizeMouseDown(e, area, 'top-left')
                                  }
                                />
                              )}
                              <ResizeHandler
                                className="center"
                                coordinates={{
                                  x: (currentRect.xMin + currentRect.xMax) / 2,
                                  y: (relativeYMin + relativeYMax) / 2
                                }}
                                areaSize={{
                                  x:
                                    (currentRect.xMax - currentRect.xMin) *
                                    scale,
                                  y: (relativeYMax - relativeYMin) * scale
                                }}
                                scale={scale}
                                onMouseDown={(e) =>
                                  handleResizeMouseDown(e, area, 'center')
                                }
                              />
                            </>
                          )}
                        {pageNumber === area.rectangle.minPage && (
                          <AreaName
                            coordinates={{
                              x: currentRect.xMin,
                              y: relativeYMin
                            }}
                            areaSize={{
                              x: (currentRect.xMax - currentRect.xMin) * scale,
                              y: (relativeYMax - relativeYMin) * scale
                            }}
                            scale={scale}
                            currentAreaName={area.name}
                          />
                        )}
                        {(withUpdateAreaButtons || withDeleteAreaButtons) &&
                          pageNumber === area.rectangle.minPage && (
                            <AreaButtonsContainer
                              coordinates={{
                                xMin: currentRect.xMin,
                                xMax: currentRect.xMax,
                                yMin: relativeYMin,
                                yMax: relativeYMax
                              }}
                              scale={scale}
                              withUpdate={withUpdateAreaButtons}
                              withDelete={withDeleteAreaButtons}
                              currentAreaId={area.id}
                              handleUpdate={handleUpdateAreaButtonClick}
                              handleDelete={handleDeleteAreaButtonClick}
                              onMouseEnter={() => setHoveredAreaId(area.id)}
                              onMouseLeave={() => setHoveredAreaId(null)}
                              onAreaClick={handleAreaClick}
                            />
                          )}
                      </React.Fragment>
                    )
                  })}
                  {mode.type === 'CREATE_RECTANGLE' &&
                    tempRect &&
                    Array.from(
                      { length: tempRect.maxPage - tempRect.minPage + 1 },
                      (_, i) => {
                        const currentPage = tempRect.minPage + i
                        if (currentPage !== pageNumber) return null

                        const isFirstPage = currentPage === tempRect.minPage
                        const isLastPage = currentPage === tempRect.maxPage
                        const pageHeight = pageHeights[currentPage - 1] || 0

                        let pageYMin = 0
                        let pageYMax = pageHeight

                        if (tempRect.minPage !== tempRect.maxPage) {
                          if (isFirstPage) {
                            pageYMin = tempRect.yMin
                          }

                          if (isLastPage) {
                            pageYMax = tempRect.yMax - pageHeight
                          }
                        } else {
                          if (isFirstPage) {
                            pageYMin = tempRect.yMin
                          }

                          if (isLastPage) {
                            pageYMax = tempRect.yMax
                          }
                        }

                        return (
                          <TemporaryArea
                            key={`temp-area-${currentPage}`}
                            coordinates={{
                              xMin: tempRect.xMin,
                              xMax: tempRect.xMax,
                              yMin: pageYMin,
                              yMax: pageYMax,
                              minPage: tempRect.minPage,
                              maxPage: tempRect.maxPage
                            }}
                            scale={scale}
                          />
                        )
                      }
                    )}
                </div>
              </div>
            )
          })}
        </div>
      </Document>
    </div>
  )
}
