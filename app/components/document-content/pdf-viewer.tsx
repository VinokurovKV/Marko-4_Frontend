// Project
import { ProjButton } from '../buttons/button'
// Styles
import './styles.css'
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
import { InteractionManagerPluginPackage } from '@embedpdf/plugin-interaction-manager/react'
import {
  CapturePluginPackage,
  type CaptureAreaEvent,
  useCapture
} from '@embedpdf/plugin-capture/react'
import {
  SelectionPluginPackage,
  SelectionLayer,
  useSelectionCapability
} from '@embedpdf/plugin-selection/react'
import { PagePointerProvider } from '@embedpdf/plugin-interaction-manager/react'
// Material UI
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Fade from '@mui/material/Fade'
import Typography from '@mui/material/Typography'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

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
  interactionMode: 'AREAS' | 'TEXT'
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

function fmtPx(n: number) {
  return `${Math.round(n * 100) / 100}px`
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
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
      createPluginRegistration(InteractionManagerPluginPackage),
      createPluginRegistration(CapturePluginPackage, {
        scale: 2.0,
        imageType: 'image/png',
        withAnnotations: true
      }),
      createPluginRegistration(TilingPluginPackage, {
        tileSize: 768,
        overlapPx: 5,
        extraRings: 0
      }),
      createPluginRegistration(ZoomPluginPackage, {
        defaultZoomLevel: ZoomMode.Automatic
      }),
      createPluginRegistration(SelectionPluginPackage)
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
      <div className="pdfv-engine-loader">
        <Fade in={showLoader} unmountOnExit>
          <div className="pdfv-engine-loader-inner">
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">
              Загрузка PDF Engine…
            </Typography>
          </div>
        </Fade>
      </div>
    )
  }

  return (
    <div className="pdfv-root">
      <EmbedPDF engine={engine} plugins={plugins}>
        {({ activeDocumentId }: { activeDocumentId: string | null }) =>
          activeDocumentId ? (
            <DocumentContent documentId={activeDocumentId}>
              {({ isLoaded }: { isLoaded: boolean }) =>
                isLoaded ? (
                  <PdfViewerBody documentId={activeDocumentId} {...props} />
                ) : (
                  <div className="pdfv-document-loader">
                    <CircularProgress size={72} />
                  </div>
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
  const { provides: capture } = useCapture(props.documentId)

  const { provides: selectionCapability } = useSelectionCapability()
  const [hasSelection, setHasSelection] = useState(false)

  useEffect(() => {
    if (!selectionCapability) return
    const scope = selectionCapability.forDocument(props.documentId)
    return scope.onSelectionChange((sel) => setHasSelection(!!sel))
  }, [selectionCapability, props.documentId])

  useEffect(() => {
    if (!selectionCapability) return

    const onKeyDown = (e: KeyboardEvent) => {
      const isCopy =
        (e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')
      if (!isCopy) return
      if (!hasSelection) return

      e.preventDefault()
      e.stopPropagation()
      selectionCapability.forDocument(props.documentId).copyToClipboard()
    }

    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      window.removeEventListener('keydown', onKeyDown, { capture: true } as any)
  }, [selectionCapability, props.documentId, hasSelection])

  const isTextMode = props.interactionMode === 'TEXT'

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

  type Corner = 'nw' | 'ne' | 'sw' | 'se'
  const [resize, setResize] = useState<null | {
    areaId: number
    pageIndex: number
    corner: Corner
    startClientX: number
    startClientY: number
    startLocalRect: Rectangle
    liveLocalRect: Rectangle
  }>(null)

  const pageScaleRef = useRef<Map<number, number>>(new Map())
  const fitDoneRef = useRef(false)

  const [tooSmallOpen, setTooSmallOpen] = useState(false)
  const [tooSmallText, setTooSmallText] = useState('')

  const pendingCaptureRef = useRef<null | {
    filename: string
    pageIndex: number
  }>(null)

  const BTN_W_PX = 28
  const BTN_H_PX = 28
  const BTN_GAP_PX = 2

  const ensureMinRectSizeByButtons = useCallback(
    (wPx: number, hPx: number): boolean => {
      const buttonsCount =
        Number(Boolean(props.withDeleteAreaButtons)) +
        Number(Boolean(props.withUpdateAreaButtons))

      const minW = buttonsCount <= 1 ? BTN_W_PX : BTN_W_PX * 2 + BTN_GAP_PX
      const minH = BTN_H_PX

      if (wPx >= minW && hPx >= minH) return true

      setTooSmallText(
        `Слишком маленькая область: ${Math.round(wPx)}×${Math.round(
          hPx
        )} px. Минимум: ${minW}×${minH} px.`
      )
      setTooSmallOpen(true)
      return false
    },
    [props.withDeleteAreaButtons, props.withUpdateAreaButtons]
  )

  const localToDocRect = useCallback(
    (pageIndex: number, localRect: Rectangle): Rectangle => {
      const offY = offsetsY[pageIndex] ?? 0
      return {
        xMin: localRect.xMin,
        xMax: localRect.xMax,
        yMin: localRect.yMin + offY,
        yMax: localRect.yMax + offY
      }
    },
    [offsetsY]
  )

  useEffect(() => {
    if (!resize) return

    const onMove = (e: PointerEvent) => {
      const pageScale = pageScaleRef.current.get(resize.pageIndex) ?? 1
      const dx = (e.clientX - resize.startClientX) / pageScale
      const dy = (e.clientY - resize.startClientY) / pageScale

      const r = resize.startLocalRect
      let next: Rectangle = { ...r }

      if (resize.corner === 'nw') {
        next.xMin = r.xMin + dx
        next.yMin = r.yMin + dy
      } else if (resize.corner === 'ne') {
        next.xMax = r.xMax + dx
        next.yMin = r.yMin + dy
      } else if (resize.corner === 'sw') {
        next.xMin = r.xMin + dx
        next.yMax = r.yMax + dy
      } else {
        next.xMax = r.xMax + dx
        next.yMax = r.yMax + dy
      }

      next = clampRect(next)
      setResize((prev) => (prev ? { ...prev, liveLocalRect: next } : prev))
    }

    const onUp = () => {
      const docRect = localToDocRect(resize.pageIndex, resize.liveLocalRect)
      props.onUpdateAreaRectangle?.({
        areaId: resize.areaId,
        rectangle: docRect
      })
      setResize(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [resize, localToDocRect, props])

  useEffect(() => {
    if (!capture) return
    return capture.onCaptureArea((result: CaptureAreaEvent) => {
      const pending = pendingCaptureRef.current
      const filename =
        pending && pending.pageIndex === result.pageIndex
          ? pending.filename
          : `capture_p${result.pageIndex + 1}.png`

      downloadBlob(result.blob, filename)
      pendingCaptureRef.current = null
    })
  }, [capture])

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

  type BrowseRequest = { areaId: number; seq: number } | null
  const [browseReq, setBrowseReq] = useState<BrowseRequest>(null)
  const browseSeqRef = useRef(0)
  const lastBrowseModeRef = useRef<PdfViewerMode | null>(null)

  useEffect(() => {
    if (props.mode.type !== 'BROWSE_AREA') {
      lastBrowseModeRef.current = props.mode
      setBrowseReq(null)
      return
    }

    if (lastBrowseModeRef.current === props.mode) return
    lastBrowseModeRef.current = props.mode

    browseSeqRef.current += 1
    setBrowseReq({ areaId: props.mode.areaId, seq: browseSeqRef.current })
  }, [props.mode])

  useEffect(() => {
    if (!browseReq) return
    scrollToArea(browseReq.areaId)
  }, [browseReq?.seq, scrollToArea])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return

      if (browseReq !== null) {
        e.preventDefault()
        e.stopPropagation()
        setBrowseReq(null)
        return
      }

      if (
        props.mode.type !== 'CREATE_RECTANGLE' &&
        props.mode.type !== 'UPDATE_AREA_RECTANGLE'
      )
        return

      e.preventDefault()
      e.stopPropagation()

      if (props.mode.type === 'CREATE_RECTANGLE') {
        props.onCreateRectangleCancel?.()
      } else {
        props.onUpdateAreaRectangleCancel?.()
      }

      setDraftPx(null)
      setResize(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    browseReq,
    props.mode,
    props.onCreateRectangleCancel,
    props.onUpdateAreaRectangleCancel
  ])

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (browseReq === null) return
      const host = viewportHostRef.current
      if (!host) return

      const path = e.composedPath?.() ?? []
      const clickedInside =
        path.includes(host) ||
        (e.target instanceof Node && host.contains(e.target))

      if (!clickedInside) return
      setBrowseReq(null)
    }

    window.addEventListener('pointerdown', onPointerDown, { capture: true })
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      window.removeEventListener('pointerdown', onPointerDown, {
        capture: true
      } as any)
    }
  }, [browseReq])

  const browsedAreaId = browseReq?.areaId ?? null

  const activeAreaId =
    props.mode.type === 'UPDATE_AREA_RECTANGLE'
      ? props.mode.areaId
      : browsedAreaId

  return (
    <div ref={viewportHostRef} className="pdfv-body-host">
      <Dialog open={tooSmallOpen} onClose={() => setTooSmallOpen(false)}>
        <DialogTitle>Область слишком маленькая</DialogTitle>
        <DialogContent>
          <Alert severity="warning">{tooSmallText}</Alert>
        </DialogContent>
        <DialogActions>
          <ProjButton
            variant="contained"
            onClick={() => setTooSmallOpen(false)}
          >
            Ок
          </ProjButton>
        </DialogActions>
      </Dialog>

      <Viewport documentId={props.documentId} className="pdfv-viewport">
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

            const pageClass = `pdfv-page--p${pageIndex}`

            const pageDynamicCssParts: string[] = []
            pageDynamicCssParts.push(
              `.${pageClass}{width:${fmtPx(width)};height:${fmtPx(height)};}`
            )

            for (const a of pageAreas) {
              const localRectForCss =
                resize && resize.areaId === a.id
                  ? resize.liveLocalRect
                  : a.localRect

              const r = localRectForCss
              const left = r.xMin * scale
              const top = r.yMin * scale
              const w = (r.xMax - r.xMin) * scale
              const h = (r.yMax - r.yMin) * scale
              const areaPosClass = `pdfv-area--id-${a.id}`
              pageDynamicCssParts.push(
                `.${pageClass} .${areaPosClass}{left:${fmtPx(left)};top:${fmtPx(
                  top
                )};width:${fmtPx(w)};height:${fmtPx(h)};}`
              )
            }

            if (draftOnPage) {
              const left = Math.min(draftOnPage.x1, draftOnPage.x2)
              const top = Math.min(draftOnPage.y1, draftOnPage.y2)
              const w = Math.abs(draftOnPage.x2 - draftOnPage.x1)
              const h = Math.abs(draftOnPage.y2 - draftOnPage.y1)
              const draftClass = `pdfv-draft-rect--p${pageIndex}`
              pageDynamicCssParts.push(
                `.${pageClass} .${draftClass}{left:${fmtPx(left)};top:${fmtPx(
                  top
                )};width:${fmtPx(w)};height:${fmtPx(h)};}`
              )
            }

            const pageDynamicCss = pageDynamicCssParts.join('')

            return (
              <div
                className={`pdfv-page ${pageClass}`}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              >
                <style>{pageDynamicCss}</style>

                <PagePointerProvider
                  documentId={props.documentId}
                  pageIndex={pageIndex}
                >
                  <RenderLayer
                    documentId={props.documentId}
                    pageIndex={pageIndex}
                    scale={scale}
                  />
                  <TilingLayer
                    documentId={props.documentId}
                    pageIndex={pageIndex}
                  />

                  {isTextMode && (
                    <div className="pdfv-selection-host">
                      <SelectionLayer
                        documentId={props.documentId}
                        pageIndex={pageIndex}
                        scale={scale}
                        textStyle={{
                          background: 'rgba(0, 120, 255, 0.25)'
                        }}
                      />
                    </div>
                  )}

                  <div className="pdfv-overlay">
                    {pageAreas.map((a) => {
                      const isActive = activeAreaId === a.id

                      const clickableInThisMode =
                        !isTextMode && props.clickableAreas
                      const canInteract =
                        !isTextMode &&
                        (props.clickableAreas ||
                          props.withUpdateAreaButtons ||
                          props.withDeleteAreaButtons)

                      const localRectForUi =
                        resize && resize.areaId === a.id
                          ? resize.liveLocalRect
                          : a.localRect

                      const wPx =
                        (localRectForUi.xMax - localRectForUi.xMin) * scale
                      const hPx =
                        (localRectForUi.yMax - localRectForUi.yMin) * scale
                      const isTiny = wPx < 110 || hPx < 44

                      const btnSx = {
                        minWidth: 0,
                        padding: isTiny ? '2px 4px' : '2px 6px',
                        lineHeight: 1.1,
                        fontSize: 12
                      } as const

                      const showAreaActions =
                        !isTextMode &&
                        props.mode.type !== 'UPDATE_AREA_RECTANGLE' &&
                        (props.withDeleteAreaButtons ||
                          props.withUpdateAreaButtons)

                      const isEditingThisArea =
                        !isTextMode &&
                        props.mode.type === 'UPDATE_AREA_RECTANGLE' &&
                        props.mode.areaId === a.id

                      const areaPosClass = `pdfv-area--id-${a.id}`

                      const areaClassName = [
                        'pdfv-area',
                        areaPosClass,
                        isActive ? 'pdfv-area--active' : 'pdfv-area--inactive',
                        canInteract
                          ? 'pdfv-area--interactive'
                          : 'pdfv-area--noninteractive',
                        clickableInThisMode
                          ? 'pdfv-area--clickable'
                          : 'pdfv-area--notclickable'
                      ].join(' ')

                      return (
                        <div
                          key={a.id}
                          className={areaClassName}
                          ref={(el) => {
                            if (el) areaElsRef.current.set(a.id, el)
                            else areaElsRef.current.delete(a.id)
                          }}
                          onClick={() => {
                            if (isTextMode) return
                            if (
                              props.mode.type === 'CREATE_RECTANGLE' ||
                              props.mode.type === 'UPDATE_AREA_RECTANGLE'
                            )
                              return
                            if (!clickableInThisMode) return
                            props.onAreaClick?.({ areaId: a.id })
                          }}
                          title={a.name}
                        >
                          <div className="pdfv-area-label">{a.name}</div>

                          {showAreaActions && (
                            <div
                              className={`pdfv-area-actions ${isTiny ? 'pdfv-area-actions--tiny' : ''}`}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {props.withDeleteAreaButtons && (
                                <ProjButton
                                  variant="contained"
                                  type="button"
                                  sx={btnSx}
                                  title="Удалить"
                                  aria-label="Удалить область"
                                  onClick={() =>
                                    props.onDeleteAreaButtonClick?.({
                                      areaId: a.id
                                    })
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </ProjButton>
                              )}

                              {props.withUpdateAreaButtons && (
                                <ProjButton
                                  variant="contained"
                                  type="button"
                                  sx={btnSx}
                                  title="Изменить"
                                  aria-label="Изменить область"
                                  onClick={() =>
                                    props.onUpdateAreaButtonClick?.({
                                      areaId: a.id
                                    })
                                  }
                                >
                                  <EditIcon fontSize="small" />
                                </ProjButton>
                              )}
                            </div>
                          )}

                          {isEditingThisArea && (
                            <>
                              {(['nw', 'ne', 'sw', 'se'] as const).map(
                                (corner) => (
                                  <div
                                    key={corner}
                                    className={`pdfv-resize-handle pdfv-resize-handle--${corner}`}
                                    onPointerDown={(e) => {
                                      e.stopPropagation()
                                      setResize({
                                        areaId: a.id,
                                        pageIndex,
                                        corner,
                                        startClientX: e.clientX,
                                        startClientY: e.clientY,
                                        startLocalRect: localRectForUi,
                                        liveLocalRect: localRectForUi
                                      })
                                    }}
                                  />
                                )
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}

                    {draftOnPage && (
                      <div
                        className={`pdfv-draft-rect pdfv-draft-rect--p${pageIndex}`}
                      />
                    )}
                  </div>

                  {!isTextMode && props.mode.type === 'CREATE_RECTANGLE' && (
                    <div
                      className="pdfv-interaction-overlay"
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

                        const wPx = Math.abs(draftPx.x2 - draftPx.x1)
                        const hPx = Math.abs(draftPx.y2 - draftPx.y1)
                        if (!ensureMinRectSizeByButtons(wPx, hPx)) {
                          setDraftPx(null)
                          return
                        }

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

                        const captureRect = {
                          x: localRectPts.xMin,
                          y: localRectPts.yMin,
                          width: localRectPts.xMax - localRectPts.xMin,
                          height: localRectPts.yMax - localRectPts.yMin
                        } as unknown as Record<string, number>

                        if (capture) {
                          const stamp = new Date()
                            .toISOString()
                            .replaceAll(':', '-')
                            .replaceAll('.', '-')
                          pendingCaptureRef.current = {
                            filename: `capture_p${pageIndex + 1}_${stamp}.png`,
                            pageIndex
                          }
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                          capture.captureArea(pageIndex, captureRect as any)
                        }

                        props.onCreateRectangle?.({ rectangle: docRect })
                        setDraftPx(null)
                      }}
                    />
                  )}
                </PagePointerProvider>
              </div>
            )
          }}
        />
      </Viewport>
    </div>
  )
}
