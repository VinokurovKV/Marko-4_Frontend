// Project
import { ProjButton } from '../buttons/button'
// React
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
// EmbedPDF
import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
import { usePdfiumEngine } from '@embedpdf/engines/react'
import {
  DocumentContent,
  DocumentManagerPluginPackage,
  useDocumentManagerCapability
} from '@embedpdf/plugin-document-manager/react'
import {
  Viewport,
  ViewportPluginPackage
} from '@embedpdf/plugin-viewport/react'
import {
  Scroller,
  ScrollPluginPackage,
  useScroll
} from '@embedpdf/plugin-scroll/react'
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/react'
import { TilingLayer, TilingPluginPackage } from '@embedpdf/plugin-tiling/react'
import {
  ZoomMode,
  ZoomPluginPackage,
  useZoom
} from '@embedpdf/plugin-zoom/react'
// Material UI
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Fade from '@mui/material/Fade'
import Typography from '@mui/material/Typography'

export interface Rectangle {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

export interface PdfArea {
  id: number
  name: string
  rectangle: Rectangle
}

export type PdfViewerMode =
  | { type: 'DEFAULT' }
  | { type: 'BROWSE_AREA'; areaId: number }
  | { type: 'CREATE_RECTANGLE' }
  | { type: 'UPDATE_AREA_RECTANGLE'; areaId: number }

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

type PageSize = { width: number; height: number }

type RenderPageArgs = {
  pageIndex: number
  width: number
  height: number
  scale?: number
}

function clampRect(r: Rectangle): Rectangle {
  return {
    xMin: Math.min(r.xMin, r.xMax),
    xMax: Math.max(r.xMin, r.xMax),
    yMin: Math.min(r.yMin, r.yMax),
    yMax: Math.max(r.yMin, r.yMax)
  }
}

function buildOffsetsY(pageSizes: PageSize[]) {
  const offsets: number[] = []
  let acc = 0
  for (const p of pageSizes) {
    offsets.push(acc)
    acc += p.height
  }
  return offsets
}

function findPageIndexByDocY(
  docY: number,
  pageSizes: PageSize[],
  offsetsY: number[]
) {
  for (let i = 0; i < pageSizes.length; i++) {
    const top = offsetsY[i]
    const bottom = top + pageSizes[i].height
    if (docY >= top && docY < bottom) return i
  }
  return -1
}

function extractPageSizes(doc: unknown): PageSize[] {
  if (!doc || typeof doc !== 'object') return []
  if (!('pages' in doc)) return []

  const pages = (doc as { pages?: unknown }).pages
  if (!Array.isArray(pages)) return []

  const sizes: PageSize[] = []
  for (const p of pages) {
    if (!p || typeof p !== 'object' || !('size' in p)) continue
    const size = (p as { size?: unknown }).size
    if (!size || typeof size !== 'object') continue

    const w = (size as { width?: unknown }).width
    const h = (size as { height?: unknown }).height
    if (typeof w === 'number' && typeof h === 'number') {
      sizes.push({ width: w, height: h })
    }
  }
  return sizes
}

export const PdfViewer: React.FC<PdfViewerProps> = (props) => {
  const { engine, isLoading, error } = usePdfiumEngine()

  const [showLoader, setShowLoader] = React.useState(false)

  React.useEffect(() => {
    if (!isLoading && engine) {
      setShowLoader(false)
      return
    }

    const t = window.setTimeout(() => setShowLoader(true), 1000)
    return () => window.clearTimeout(t)
  }, [isLoading, engine])

  const plugins = useMemo(
    () => [
      createPluginRegistration(DocumentManagerPluginPackage, {
        initialDocuments: [{ buffer: props.data, name: 'document.pdf' }]
      }),
      createPluginRegistration(ViewportPluginPackage),
      createPluginRegistration(ScrollPluginPackage, { defaultPageGap: 10 }),
      createPluginRegistration(RenderPluginPackage),
      createPluginRegistration(TilingPluginPackage, {
        tileSize: 768,
        overlapPx: 5,
        extraRings: 0
      }),
      createPluginRegistration(ZoomPluginPackage, {
        defaultZoomLevel: ZoomMode.Automatic
      })
    ],
    [props.data]
  )

  if (error) {
    return (
      <Alert severity="error" variant="outlined" sx={{ my: 1 }}>
        Engine error: {String(error.message ?? error)}
      </Alert>
    )
  }

  if (isLoading || !engine) {
    return (
      <Box
        sx={{
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Fade in={showLoader} unmountOnExit>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1
            }}
          >
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">
              Загрузка PDF Engine…
            </Typography>
          </Box>
        </Fade>
      </Box>
    )
  }

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <EmbedPDF engine={engine} plugins={plugins}>
        {({ activeDocumentId }: { activeDocumentId: string | null }) =>
          activeDocumentId ? (
            <DocumentContent documentId={activeDocumentId}>
              {({ isLoaded }: { isLoaded: boolean }) =>
                isLoaded ? (
                  <PdfViewerBody documentId={activeDocumentId} {...props} />
                ) : (
                  <Box
                    sx={{
                      height: 240,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CircularProgress size={72} />
                  </Box>
                )
              }
            </DocumentContent>
          ) : (
            <></>
          )
        }
      </EmbedPDF>
    </div>
  )
}

const PdfViewerBody: React.FC<PdfViewerProps & { documentId: string }> = (
  props
) => {
  const { provides: docManager } = useDocumentManagerCapability()
  const { provides: scroll } = useScroll(props.documentId)
  const { provides: zoom } = useZoom(props.documentId)

  const [pageSizes, setPageSizes] = useState<PageSize[]>([])
  const offsetsY = useMemo(() => buildOffsetsY(pageSizes), [pageSizes])

  const areaElsRef = useRef<Map<number, HTMLDivElement>>(new Map())
  const viewportHostRef = useRef<HTMLDivElement | null>(null)

  const [draftPx, setDraftPx] = useState<null | {
    pageIndex: number
    x1: number
    y1: number
    x2: number
    y2: number
  }>(null)

  const pageScaleRef = useRef<Map<number, number>>(new Map())
  const fitDoneRef = useRef(false)

  useEffect(() => {
    if (!docManager) return
    const doc = docManager.getDocument(props.documentId) as unknown
    const sizes = extractPageSizes(doc)
    if (sizes.length > 0) setPageSizes(sizes)
  }, [docManager, props.documentId])

  useEffect(() => {
    fitDoneRef.current = false
  }, [props.documentId])

  useEffect(() => {
    if (!zoom) return
    const host = viewportHostRef.current
    if (!host) return

    let raf = 0
    const tryFit = () => {
      if (fitDoneRef.current) return
      const w = host.clientWidth
      const h = host.clientHeight
      if (w > 0 && h > 0) {
        zoom.requestZoom(ZoomMode.FitWidth)
        fitDoneRef.current = true
        return
      }
      raf = window.requestAnimationFrame(tryFit)
    }

    raf = window.requestAnimationFrame(tryFit)
    return () => window.cancelAnimationFrame(raf)
  }, [zoom, props.documentId])

  const derivedAreas = useMemo(() => {
    if (!pageSizes.length) return []

    return props.areas
      .map((a) => {
        const pageIndex = findPageIndexByDocY(
          a.rectangle.yMin,
          pageSizes,
          offsetsY
        )
        if (pageIndex < 0) return null

        const offY = offsetsY[pageIndex]
        return {
          ...a,
          pageIndex,
          localRect: {
            xMin: a.rectangle.xMin,
            xMax: a.rectangle.xMax,
            yMin: a.rectangle.yMin - offY,
            yMax: a.rectangle.yMax - offY
          }
        }
      })
      .filter(Boolean) as Array<
      PdfArea & { pageIndex: number; localRect: Rectangle }
    >
  }, [props.areas, pageSizes, offsetsY])

  const scrollToArea = useCallback(
    (areaId: number) => {
      const a = derivedAreas.find((x) => x.id === areaId)
      if (!a) return

      scroll?.scrollToPage?.({
        pageNumber: a.pageIndex + 1,
        behavior: 'smooth'
      })
      window.setTimeout(() => {
        const el = areaElsRef.current.get(areaId)
        el?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        })
      }, 200)
    },
    [derivedAreas, scroll]
  )

  useEffect(() => {
    if (props.mode.type === 'BROWSE_AREA') scrollToArea(props.mode.areaId)
    if (props.mode.type === 'UPDATE_AREA_RECTANGLE')
      scrollToArea(props.mode.areaId)
  }, [props.mode, scrollToArea])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (props.mode.type === 'CREATE_RECTANGLE')
        props.onCreateRectangleCancel?.()
      if (props.mode.type === 'UPDATE_AREA_RECTANGLE')
        props.onUpdateAreaRectangleCancel?.()
      setDraftPx(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    props.mode,
    props.onCreateRectangleCancel,
    props.onUpdateAreaRectangleCancel
  ])

  const activeAreaId =
    props.mode.type === 'BROWSE_AREA'
      ? props.mode.areaId
      : props.mode.type === 'UPDATE_AREA_RECTANGLE'
        ? props.mode.areaId
        : null

  return (
    <div
      ref={viewportHostRef}
      style={{
        height: '100%',
        width: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden'
      }}
    >
      <Viewport
        documentId={props.documentId}
        style={{
          height: '100%',
          width: '100%',
          background: '#f1f3f5',
          minHeight: 0,
          minWidth: 0
        }}
      >
        <Scroller
          documentId={props.documentId}
          renderPage={(page: RenderPageArgs) => {
            const { pageIndex, width, height } = page
            const fallbackScale = pageSizes[pageIndex]?.width
              ? width / pageSizes[pageIndex].width
              : 1
            const scale =
              typeof page.scale === 'number' ? page.scale : fallbackScale

            pageScaleRef.current.set(pageIndex, scale)

            const pageAreas = derivedAreas.filter(
              (a) => a.pageIndex === pageIndex
            )
            const draftOnPage =
              draftPx?.pageIndex === pageIndex ? draftPx : null

            return (
              <div style={{ width, height, position: 'relative' }}>
                <RenderLayer
                  documentId={props.documentId}
                  pageIndex={pageIndex}
                  scale={scale}
                />
                <TilingLayer
                  documentId={props.documentId}
                  pageIndex={pageIndex}
                />

                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 20,
                    pointerEvents: 'none'
                  }}
                >
                  {pageAreas.map((a) => {
                    const r = a.localRect
                    const left = r.xMin * scale
                    const top = r.yMin * scale
                    const w = (r.xMax - r.xMin) * scale
                    const h = (r.yMax - r.yMin) * scale

                    const isActive = activeAreaId === a.id
                    const canInteract =
                      props.clickableAreas ||
                      props.withUpdateAreaButtons ||
                      props.withDeleteAreaButtons

                    return (
                      <div
                        key={a.id}
                        ref={(el) => {
                          if (el) areaElsRef.current.set(a.id, el)
                          else areaElsRef.current.delete(a.id)
                        }}
                        onClick={() => {
                          if (!props.clickableAreas) return
                          props.onAreaClick?.({ areaId: a.id })
                        }}
                        title={a.name}
                        style={{
                          position: 'absolute',
                          left,
                          top,
                          width: w,
                          height: h,
                          border: isActive
                            ? '2px solid #1c7ed6'
                            : '2px solid rgba(255,165,0,0.9)',
                          background: isActive
                            ? 'rgba(28,126,214,0.12)'
                            : 'rgba(255,165,0,0.10)',
                          boxSizing: 'border-box',
                          borderRadius: 4,
                          pointerEvents: canInteract ? 'auto' : 'none',
                          cursor: props.clickableAreas ? 'pointer' : 'default'
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: -22,
                            fontSize: 12,
                            padding: '2px 6px',
                            borderRadius: 6,
                            background: 'rgba(0,0,0,0.75)',
                            color: 'white',
                            pointerEvents: 'none',
                            maxWidth: 260,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {a.name} (id={a.id})
                        </div>

                        {props.withDeleteAreaButtons && (
                          <ProjButton
                            variant="contained"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              props.onDeleteAreaButtonClick?.({ areaId: a.id })
                            }}
                          >
                            Удалить
                          </ProjButton>
                        )}

                        {props.withUpdateAreaButtons && (
                          <ProjButton
                            variant="contained"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              props.onUpdateAreaButtonClick?.({ areaId: a.id })
                            }}
                          >
                            Изменить
                          </ProjButton>
                        )}
                      </div>
                    )
                  })}

                  {draftOnPage && (
                    <div
                      style={{
                        position: 'absolute',
                        left: Math.min(draftOnPage.x1, draftOnPage.x2),
                        top: Math.min(draftOnPage.y1, draftOnPage.y2),
                        width: Math.abs(draftOnPage.x2 - draftOnPage.x1),
                        height: Math.abs(draftOnPage.y2 - draftOnPage.y1),
                        border: '2px dashed #12b886',
                        background: 'rgba(18,184,134,0.10)',
                        borderRadius: 4,
                        pointerEvents: 'none'
                      }}
                    />
                  )}
                </div>

                {(props.mode.type === 'CREATE_RECTANGLE' ||
                  props.mode.type === 'UPDATE_AREA_RECTANGLE') && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 25,
                      cursor: 'crosshair',
                      background: 'transparent'
                    }}
                    onMouseDown={(e) => {
                      const rect = (
                        e.currentTarget as HTMLDivElement
                      ).getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const y = e.clientY - rect.top
                      setDraftPx({ pageIndex, x1: x, y1: y, x2: x, y2: y })
                    }}
                    onMouseMove={(e) => {
                      if (!draftPx || draftPx.pageIndex !== pageIndex) return
                      const rect = (
                        e.currentTarget as HTMLDivElement
                      ).getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const y = e.clientY - rect.top
                      setDraftPx((prev) =>
                        prev ? { ...prev, x2: x, y2: y } : prev
                      )
                    }}
                    onMouseUp={() => {
                      if (!draftPx || draftPx.pageIndex !== pageIndex) return

                      const pageScale =
                        pageScaleRef.current.get(pageIndex) ?? scale
                      const localRectPts = clampRect({
                        xMin: Math.min(draftPx.x1, draftPx.x2) / pageScale,
                        xMax: Math.max(draftPx.x1, draftPx.x2) / pageScale,
                        yMin: Math.min(draftPx.y1, draftPx.y2) / pageScale,
                        yMax: Math.max(draftPx.y1, draftPx.y2) / pageScale
                      })

                      const offY = offsetsY[pageIndex] ?? 0
                      const docRect: Rectangle = {
                        ...localRectPts,
                        yMin: localRectPts.yMin + offY,
                        yMax: localRectPts.yMax + offY
                      }

                      if (props.mode.type === 'CREATE_RECTANGLE') {
                        props.onCreateRectangle?.({ rectangle: docRect })
                      } else {
                        if (props.mode.type === 'UPDATE_AREA_RECTANGLE') {
                          props.onUpdateAreaRectangle?.({
                            areaId: props.mode.areaId,
                            rectangle: docRect
                          })
                        }
                      }

                      setDraftPx(null)
                    }}
                  />
                )}
              </div>
            )
          }}
        />
      </Viewport>
    </div>
  )
}
