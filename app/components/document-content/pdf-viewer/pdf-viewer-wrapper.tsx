import { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import type { PdfViewerMode, Rectangle } from './pdf-viewer'
import Button from '../base-components/button'
import Thumbnail from './thumbnail'
import './pdf-viewer-wrapper-styles.css'

const PdfViewer = lazy(() =>
  import('./pdf-viewer').then((module) => ({
    default: module.PdfViewer
  }))
)

export function PdfViewerWrapper() {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [isBrowser, setIsBrowser] = useState(false)
  const [mode, setMode] = useState<PdfViewerMode>({ type: 'DEFAULT' })
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false)
  const [thumbnailIsLoaded, setThumbnailIsLoaded] = useState<boolean>(false)
  const [areas, setAreas] = useState([
    {
      id: 1,
      name: 'Area 1',
      rectangle: {
        xMin: 50,
        xMax: 200,
        yMin: 50,
        yMax: 150,
        minPage: 1,
        maxPage: 1
      }
    },
    {
      id: 2,
      name: 'Area 2',
      rectangle: {
        xMin: 250,
        xMax: 400,
        yMin: 0,
        yMax: 700,
        minPage: 2,
        maxPage: 4
      }
    }
  ])

  useEffect(() => {
    setIsBrowser(typeof window !== 'undefined')
  }, [])

  const handleAreaClick = (data: { areaId: number }) => {
    if (mode.type !== 'UPDATE_AREA_RECTANGLE') {
      alert(`Нажата область ${data.areaId}`)
    }
  }

  const handleUpdateAreaButtonClick = (data: { areaId: number }) => {
    setMode({ type: 'UPDATE_AREA_RECTANGLE', areaId: data.areaId })
  }

  const handleDeleteAreaButtonClick = (data: { areaId: number }) => {
    setAreas((prevAreas) => prevAreas.filter((area) => area.id !== data.areaId))
  }

  const handleCreateRectangle = (data: { rectangle: Rectangle }) => {
    const newAreaId =
      areas.length > 0 ? Math.max(...areas.map((area) => area.id)) + 1 : 1
    const newArea = {
      id: newAreaId,
      name: `Area ${newAreaId}`,
      rectangle: data.rectangle
    }
    setAreas([...areas, newArea])
    setMode({ type: 'DEFAULT' })
  }

  const handleCreateRectangleCancel = () => {
    setMode({ type: 'DEFAULT' })
  }

  const handleUpdateAreaRectangle = (data: {
    areaId: number
    rectangle: Rectangle
  }) => {
    const updatedAreas = areas.map((area) => {
      if (area.id === data.areaId) {
        return {
          ...area,
          rectangle: data.rectangle
        }
      }
      return area
    })
    setAreas(updatedAreas)
    setMode({ type: 'DEFAULT' })
  }

  const handleUpdateAreaRectangleCancel = () => {
    setMode({ type: 'DEFAULT' })
  }

  const handleBrowseAreaClick = (data: { areaId: number }) => {
    setMode({ type: 'BROWSE_AREA', areaId: data.areaId })
  }

  const handleNextPage = () => {
    const nextPageElement = document.querySelector(
      `[data-page="${currentPage + 1}"]`
    )
    if (nextPageElement) {
      nextPageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
      setCurrentPage((page) => page + 1)
    }
  }

  const handlePrevPage = () => {
    const prevPageElement = document.querySelector(
      `[data-page="${currentPage - 1}"]`
    )
    if (prevPageElement) {
      prevPageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
      setCurrentPage((page) => Math.max(1, page - 1))
    }
  }

  const handleThumbnailClick = (pageNumber: number) => {
    const pageElement = document.querySelector(`[data-page="${pageNumber}"]`)
    if (pageElement) {
      pageElement.scrollIntoView({
        behavior: 'instant',
        block: 'start'
      })
      setCurrentPage(pageNumber)
    }
  }

  const countTotalPages = useCallback(() => {
    const pageElements = document.querySelectorAll('[data-page]')
    if (pageElements.length > 0) {
      const pageNumbers = Array.from(pageElements).map((element) =>
        parseInt(element.getAttribute('data-page') || '0')
      )
      const maxPage = Math.max(...pageNumbers)
      setTotalPages(maxPage)
      setThumbnailIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (pdfData) {
      const timer = setTimeout(() => {
        countTotalPages()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [pdfData, countTotalPages])

  useEffect(() => {
    const loadTestPdf = async () => {
      try {
        const response = await fetch('/NPU3.pdf')
        const arrayBuffer = await response.arrayBuffer()
        setPdfData(arrayBuffer)
      } catch (error) {
        console.error('Ошибка загрузки PDF:', error)
      }
    }
    void loadTestPdf()
  }, [])

  return (
    <div className="pdf-viewer-wrapper">
      <div className="pdf-toolbar">
        <div className="toolbar-left">
          <Button
            type="button"
            dataAction="show-thumbnails"
            className="toolbar-button"
            imageName="file_open"
            onClick={() => setShowThumbnails(!showThumbnails)}
          />

          <div className="page-navigation">
            <Button
              type="button"
              dataAction="to-previous-page"
              className="nav-button"
              imageName="arrow_back"
              disabled={currentPage <= 1}
              onClick={handlePrevPage}
            />
            <span className="page-info">{currentPage}</span>
            <Button
              type="button"
              dataAction="to-next-page"
              className="nav-button"
              imageName="arrow_forward"
              onClick={handleNextPage}
            />
          </div>

          <Button
            type="button"
            text="Просмотреть область"
            dataAction="browse-area"
            onClick={() => handleBrowseAreaClick({ areaId: 1 })}
          />
          <Button
            type="button"
            text="Создать область"
            dataAction="create-rectangle"
            onClick={() => setMode({ type: 'CREATE_RECTANGLE' })}
          />
        </div>

        <div className="toolbar-center">
          <span className="document-title">NPU3.pdf</span>
        </div>

        <div className="toolbar-right">
          <Button type="button" imageName="search" className="toolbar-button" />
          <Button
            type="button"
            imageName="fullscreen"
            className="toolbar-button"
          />
        </div>
      </div>

      <div className="pdf-content-area">
        {showThumbnails && (
          <div className="pdf-sidebar">
            <div className="sidebar-header">
              <h3>Страницы</h3>
              <Button
                type="button"
                imageName="clear"
                dataAction="toggle-sidebar"
                onClick={() => setShowThumbnails(false)}
              />
            </div>
            <div className="thumbnails-container">
              {thumbnailIsLoaded && pdfData && totalPages ? (
                Array.from({ length: totalPages }, (_, index) => (
                  <div key={index + 1} className="thumbnail-wrapper">
                    <Thumbnail
                      pageNumber={index + 1}
                      pdfFile={{ data: pdfData }}
                      isSelected={currentPage === index + 1}
                      onClick={handleThumbnailClick}
                      width={100}
                    />
                  </div>
                ))
              ) : (
                <div className="thumbnail-placeholder">
                  Загрузка миниатюр...
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pdf-main-content">
          {isBrowser && pdfData && (
            <Suspense
              fallback={<div className="pdf-loading">Загрузка PDF...</div>}
            >
              <PdfViewer
                data={pdfData}
                areas={areas}
                clickableAreas={true}
                withUpdateAreaButtons={true}
                withDeleteAreaButtons={true}
                mode={mode}
                onAreaClick={handleAreaClick}
                onUpdateAreaButtonClick={handleUpdateAreaButtonClick}
                onDeleteAreaButtonClick={handleDeleteAreaButtonClick}
                onCreateRectangle={handleCreateRectangle}
                onCreateRectangleCancel={handleCreateRectangleCancel}
                onUpdateAreaRectangle={handleUpdateAreaRectangle}
                onUpdateAreaRectangleCancel={handleUpdateAreaRectangleCancel}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
