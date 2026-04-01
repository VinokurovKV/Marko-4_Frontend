// Project
import { ProjButton } from '../buttons/button'
import { PdfViewerThumbnails } from './pdf-viewer-thumbnails'
import { gray, red } from '~/theme/themePrimitives'
// Styles
import './styles.css'
// React
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
// EmbedPDF
import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
import { usePdfiumEngine } from '@embedpdf/engines/react'
import { MatchFlag, type SearchResult } from '@embedpdf/models'
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
  MarqueeCapture,
  type CaptureAreaEvent,
  useCapture
} from '@embedpdf/plugin-capture/react'
import {
  SelectionPluginPackage,
  SelectionLayer,
  useSelectionCapability
} from '@embedpdf/plugin-selection/react'
import { PagePointerProvider } from '@embedpdf/plugin-interaction-manager/react'
import { ThumbnailPluginPackage } from '@embedpdf/plugin-thumbnail/react'
import { SearchPluginPackage, useSearch } from '@embedpdf/plugin-search/react'
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
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'

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
  withCaptureAreaButtons: boolean
  withRenameAreaButtons: boolean
  mode: PdfViewerMode
  interactionMode: 'AREAS' | 'TEXT'
  searchText?: string
  searchCaseSensitive?: boolean
  searchWholeWord?: boolean
  searchPreviousRequest?: number
  searchNextRequest?: number
  onSearchPendingChange?: (isPending: boolean) => void
  onSearchStateChange?: (data: { total: number; activeIndex: number }) => void
  onAreaClick?: (data: { areaId: number }) => void | null
  onUpdateAreaButtonClick?: (data: { areaId: number }) => void | null
  onDeleteAreaButtonClick?: (data: { areaId: number }) => void | null
  onRenameAreaButtonClick?: (data: { areaId: number }) => void | null
  onCreateRectangle?: (data: {
    rectangle: Rectangle
    configFile?: File
  }) => void | null
  onCreateRectangleCancel?: () => void | null
  onBrowseAreaCancel?: () => void | null
  onUpdateAreaRectangle?: (data: {
    areaId: number
    rectangle: Rectangle
    configFile?: File
  }) => void | null
  onUpdateAreaRectangleCancel?: () => void | null
}

type PageSize = { width: number; height: number }

type CaptureRect = {
  origin: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
}

const toCaptureRect = (rect: Rectangle): CaptureRect => ({
  origin: {
    x: rect.xMin,
    y: rect.yMin
  },
  size: {
    width: rect.xMax - rect.xMin,
    height: rect.yMax - rect.yMin
  }
})

const getDateStamp = (): string => {
  const d = new Date()

  const yy = String(d.getFullYear()).slice(-2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')

  return `${yy}-${mm}-${dd}`
}

const SEARCH_TIMEOUT_MS = 15000

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

type DisplayedSearchResult = {
  actualIndex: number
  result: SearchResult
}

type SearchHighlightRect = SearchResult['rects'][number]

const CYRILLIC_RE = /[\p{Script=Cyrillic}]/u
const WORD_CHAR_RE = /[\p{L}\p{N}_]/u

function hasCyrillicChars(value: string): boolean {
  return CYRILLIC_RE.test(value)
}

function isWordChar(value: string): boolean {
  return WORD_CHAR_RE.test(value)
}

function isWholeWordContextMatch(
  context: SearchResult['context'] | undefined
): boolean {
  const before = context?.before ?? ''
  const after = context?.after ?? ''
  const beforeChar = before.length > 0 ? before[before.length - 1] : ''
  const afterChar = after.length > 0 ? after[0] : ''

  return !isWordChar(beforeChar) && !isWordChar(afterChar)
}

function getDisplayedSearchResults(
  results: SearchResult[],
  query: string,
  searchWholeWord?: boolean
): DisplayedSearchResult[] {
  const useClientWholeWord = Boolean(searchWholeWord && hasCyrillicChars(query))

  return results.flatMap((result, actualIndex) => {
    if (useClientWholeWord && !isWholeWordContextMatch(result.context)) {
      return []
    }

    return [{ actualIndex, result }]
  })
}

function mergeSearchHighlightRects(
  rects: SearchHighlightRect[]
): SearchHighlightRect[] {
  if (rects.length <= 1) return rects

  const sortedRects = [...rects].sort((a, b) => {
    const centerYDiff =
      a.origin.y + a.size.height / 2 - (b.origin.y + b.size.height / 2)

    if (Math.abs(centerYDiff) > 0.5) {
      return centerYDiff
    }

    return a.origin.x - b.origin.x
  })

  const mergedRects: SearchHighlightRect[] = []

  for (const rect of sortedRects) {
    const rectTop = rect.origin.y
    const rectBottom = rect.origin.y + rect.size.height
    const rectCenterY = rect.origin.y + rect.size.height / 2

    const targetRect = mergedRects.find((current) => {
      const currentTop = current.origin.y
      const currentBottom = current.origin.y + current.size.height
      const currentCenterY = current.origin.y + current.size.height / 2
      const overlapY =
        Math.min(rectBottom, currentBottom) - Math.max(rectTop, currentTop)
      const lineTolerance =
        Math.max(rect.size.height, current.size.height) * 0.6

      return (
        overlapY > 0 || Math.abs(rectCenterY - currentCenterY) <= lineTolerance
      )
    })

    if (!targetRect) {
      mergedRects.push({
        origin: { ...rect.origin },
        size: { ...rect.size }
      })
      continue
    }

    const left = Math.min(targetRect.origin.x, rect.origin.x)
    const top = Math.min(targetRect.origin.y, rect.origin.y)
    const right = Math.max(
      targetRect.origin.x + targetRect.size.width,
      rect.origin.x + rect.size.width
    )
    const bottom = Math.max(
      targetRect.origin.y + targetRect.size.height,
      rect.origin.y + rect.size.height
    )

    targetRect.origin.x = left
    targetRect.origin.y = top
    targetRect.size.width = right - left
    targetRect.size.height = bottom - top
  }

  return mergedRects
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

function isElementFullyVisibleInContainer(
  el: HTMLElement,
  container: HTMLElement
): boolean {
  const elRect = el.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()

  return (
    elRect.top >= containerRect.top &&
    elRect.bottom <= containerRect.bottom &&
    elRect.left >= containerRect.left &&
    elRect.right <= containerRect.right
  )
}

async function detectBlobImgAllowed(): Promise<boolean> {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/png'
      )
    })

    const url = URL.createObjectURL(blob)
    const ok: boolean = await new Promise((resolve) => {
      const img = new Image()
      const t = window.setTimeout(() => resolve(false), 800)
      img.onload = () => {
        window.clearTimeout(t)
        resolve(true)
      }
      img.onerror = () => {
        window.clearTimeout(t)
        resolve(false)
      }
      img.src = url
    })

    URL.revokeObjectURL(url)
    return ok
  } catch {
    return false
  }
}

export const PdfViewer = React.memo(function PdfViewer(props: PdfViewerProps) {
  const { engine, isLoading, error } = usePdfiumEngine()
  const [showLoader, setShowLoader] = React.useState(false)
  const [blobImgAllowed, setBlobImgAllowed] = React.useState<boolean | null>(
    null
  )

  useEffect(() => {
    if (!isLoading && engine) {
      setShowLoader(false)
      return
    }
    const t = window.setTimeout(() => setShowLoader(true), 1000)
    return () => window.clearTimeout(t)
  }, [isLoading, engine])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const ok = await detectBlobImgAllowed()
      if (!cancelled) setBlobImgAllowed(ok)
    })()
    return () => {
      cancelled = true
    }
  }, [])

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
      ...(blobImgAllowed === true
        ? [
            createPluginRegistration(TilingPluginPackage, {
              tileSize: 768,
              overlapPx: 5,
              extraRings: 0
            })
          ]
        : []),
      createPluginRegistration(ZoomPluginPackage, {
        defaultZoomLevel: ZoomMode.Automatic
      }),
      createPluginRegistration(SelectionPluginPackage),
      createPluginRegistration(ThumbnailPluginPackage, {
        width: 150,
        gap: 12,
        autoScroll: true
      }),
      createPluginRegistration(SearchPluginPackage)
    ],
    [props.data, blobImgAllowed]
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
                  <PdfViewerBody
                    documentId={activeDocumentId}
                    enableTiling={blobImgAllowed === true}
                    {...props}
                  />
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
})

const PdfViewerBody: React.FC<
  PdfViewerProps & {
    documentId: string
    enableTiling: boolean
  }
> = (props) => {
  const { provides: docManager } = useDocumentManagerCapability()
  const { provides: zoom } = useZoom(props.documentId)
  const { provides: capture } = useCapture(props.documentId)
  const { provides: scroll } = useScroll(props.documentId)
  const { provides: search } = useSearch(props.documentId)

  const scrollRef = useRef(scroll)
  const searchRef = useRef(search)

  useEffect(() => {
    scrollRef.current = scroll
  }, [scroll])

  useEffect(() => {
    searchRef.current = search
  }, [search])

  useEffect(() => {
    const searchApi = searchRef.current
    if (!searchApi) return

    const flags: MatchFlag[] = []
    const query = props.searchText?.trim() ?? ''
    const useClientWholeWord = Boolean(
      props.searchWholeWord && hasCyrillicChars(query)
    )

    if (props.searchCaseSensitive) {
      flags.push(MatchFlag.MatchCase)
    }

    if (props.searchWholeWord && !useClientWholeWord) {
      flags.push(MatchFlag.MatchWholeWord)
    }

    searchApi.setFlags(flags)
  }, [
    props.documentId,
    props.searchCaseSensitive,
    props.searchText,
    props.searchWholeWord
  ])

  const lastSearchTextRef = useRef('')
  const searchTotalRef = useRef(0)
  const searchActiveIndexRef = useRef(0)
  const displayedSearchResultsRef = useRef<DisplayedSearchResult[]>([])
  const onSearchStateChangeRef = useRef(props.onSearchStateChange)
  const handledSearchNextRequestRef = useRef(0)
  const handledSearchPreviousRequestRef = useRef(0)
  const preferredSearchResultIndexRef = useRef<number | null>(null)

  useEffect(() => {
    onSearchStateChangeRef.current = props.onSearchStateChange
  }, [props.onSearchStateChange])

  const searchRunIdRef = useRef(0)
  const suppressActiveResultEffectRef = useRef(false)

  const onSearchPendingChangeRef = useRef(props.onSearchPendingChange)
  const lastSearchPendingRef = useRef<boolean | null>(null)

  const lastPushedSearchStateRef = useRef<{
    total: number
    activeIndex: number
  }>({
    total: -1,
    activeIndex: -1
  })
  const [customSearchResults, setCustomSearchResults] = useState<
    DisplayedSearchResult[]
  >([])
  const [customSearchActiveActualIndex, setCustomSearchActiveActualIndex] =
    useState(-1)

  useEffect(() => {
    onSearchPendingChangeRef.current = props.onSearchPendingChange
  }, [props.onSearchPendingChange])

  const pushSearchPending = React.useCallback((isPending: boolean) => {
    if (lastSearchPendingRef.current === isPending) return

    lastSearchPendingRef.current = isPending
    onSearchPendingChangeRef.current?.(isPending)
  }, [])

  const pushSearchState = React.useCallback(
    (total: number, activeIndex: number) => {
      const prev = lastPushedSearchStateRef.current

      if (prev.total === total && prev.activeIndex === activeIndex) {
        return
      }

      lastPushedSearchStateRef.current = { total, activeIndex }
      searchTotalRef.current = total
      searchActiveIndexRef.current = activeIndex

      onSearchStateChangeRef.current?.({
        total,
        activeIndex
      })
    },
    []
  )

  const syncDisplayedSearchResults = React.useCallback(
    (state: unknown, query: string) => {
      const s =
        state && typeof state === 'object'
          ? (state as {
              results?: SearchResult[]
              activeResultIndex?: number
            })
          : undefined

      const rawResults = Array.isArray(s?.results) ? s.results : []
      const displayedResults = getDisplayedSearchResults(
        rawResults,
        query,
        props.searchWholeWord
      )
      const activeActualIndex =
        typeof s?.activeResultIndex === 'number' ? s.activeResultIndex : -1
      const activeDisplayedIndex = displayedResults.findIndex(
        (item) => item.actualIndex === activeActualIndex
      )

      displayedSearchResultsRef.current = displayedResults
      setCustomSearchResults(displayedResults)
      setCustomSearchActiveActualIndex(activeActualIndex)

      return {
        displayedResults,
        activeDisplayedIndex
      }
    },
    [props.searchWholeWord]
  )

  const syncSearchState = React.useCallback(
    (state: unknown, query: string = props.searchText?.trim() ?? '') => {
      const { displayedResults, activeDisplayedIndex } =
        syncDisplayedSearchResults(state, query)

      if (!state || typeof state !== 'object') {
        pushSearchState(0, 0)
        return
      }

      const total = displayedResults.length
      const activeIndex =
        total > 0 && activeDisplayedIndex >= 0 ? activeDisplayedIndex + 1 : 0

      pushSearchState(total, activeIndex)
    },
    [props.searchText, pushSearchState, syncDisplayedSearchResults]
  )

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
  const [currentPageIndex, setCurrentPageIndex] = useState<number | null>(null)

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

  const [dragArea, setDragArea] = useState<null | {
    areaId: number
    pageIndex: number
    startClientX: number
    startClientY: number
    startLocalRect: Rectangle
    liveLocalRect: Rectangle
  }>(null)

  const pageScaleRef = useRef<Map<number, number>>(new Map())
  const fitDoneRef = useRef(false)

  const [tooSmallOpen, setTooSmallOpen] = useState(false)
  const [tooSmallText, setTooSmallText] = useState('')

  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null)
  const [capturedImageName, setCapturedImageName] = useState<string>('')

  const pendingCaptureRef = useRef<null | {
    filename: string
    pageIndex: number
    onCaptured?: (result: CaptureAreaEvent) => void
  }>(null)

  const BTN_W_PX = 28
  const BTN_H_PX = 28
  const BTN_GAP_PX = 2

  const captureRectangleToFile = useCallback(
    (pageIndex: number, localRect: Rectangle, filename: string) => {
      if (!capture) {
        return Promise.resolve<File | undefined>(undefined)
      }

      return new Promise<File | undefined>((resolve) => {
        pendingCaptureRef.current = {
          filename,
          pageIndex,
          onCaptured: (result) => {
            resolve(
              new File([result.blob], filename, {
                type: result.blob.type || 'image/png'
              })
            )
          }
        }

        capture.captureArea(pageIndex, toCaptureRect(localRect))
      })
    },
    [capture]
  )

  const ensureMinRectSizeByButtons = useCallback(
    (wPx: number, hPx: number): boolean => {
      const buttonsCount =
        Number(Boolean(props.withDeleteAreaButtons)) +
        Number(Boolean(props.withUpdateAreaButtons)) +
        Number(Boolean(props.withCaptureAreaButtons))

      const minW =
        buttonsCount <= 0
          ? 0
          : BTN_W_PX * buttonsCount + BTN_GAP_PX * (buttonsCount - 1)
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
    [
      props.withDeleteAreaButtons,
      props.withUpdateAreaButtons,
      props.withCaptureAreaButtons
    ]
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

  const clampRectToPage = useCallback(
    (pageIndex: number, rect: Rectangle): Rectangle => {
      const page = pageSizes[pageIndex]
      if (!page) return rect

      const width = rect.xMax - rect.xMin
      const height = rect.yMax - rect.yMin

      let xMin = rect.xMin
      let yMin = rect.yMin

      if (xMin < 0) xMin = 0
      if (yMin < 0) yMin = 0
      if (xMin + width > page.width) xMin = page.width - width
      if (yMin + height > page.height) yMin = page.height - height

      xMin = Math.max(0, xMin)
      yMin = Math.max(0, yMin)

      return {
        xMin,
        xMax: xMin + width,
        yMin,
        yMax: yMin + height
      }
    },
    [pageSizes]
  )

  useEffect(() => {
    if (!resize) return

    const onMove = (e: PointerEvent) => {
      const pageScale = pageScaleRef.current.get(resize.pageIndex) ?? 1
      const dx = (e.clientX - resize.startClientX) / pageScale
      const dy = (e.clientY - resize.startClientY) / pageScale

      const r = resize.startLocalRect
      const page = pageSizes[resize.pageIndex]
      if (!page) return

      let next: Rectangle = { ...r }

      if (resize.corner === 'nw') {
        next.xMin = Math.max(0, Math.min(r.xMax, r.xMin + dx))
        next.yMin = r.yMin + dy
      } else if (resize.corner === 'ne') {
        next.xMax = Math.min(page.width, Math.max(r.xMin, r.xMax + dx))
        next.yMin = r.yMin + dy
      } else if (resize.corner === 'sw') {
        next.xMin = Math.max(0, Math.min(r.xMax, r.xMin + dx))
        next.yMax = r.yMax + dy
      } else {
        next.xMax = Math.min(page.width, Math.max(r.xMin, r.xMax + dx))
        next.yMax = r.yMax + dy
      }

      next = clampRect(next)
      setResize((prev) => (prev ? { ...prev, liveLocalRect: next } : prev))
    }

    const onUp = () => {
      const docRect = localToDocRect(resize.pageIndex, resize.liveLocalRect)
      const fileName = `fragment_${resize.areaId}_${getDateStamp()}.png`

      void (async () => {
        const configFile = await captureRectangleToFile(
          resize.pageIndex,
          resize.liveLocalRect,
          fileName
        )

        props.onUpdateAreaRectangle?.({
          areaId: resize.areaId,
          rectangle: docRect,
          configFile
        })
        setResize(null)
      })()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [resize, localToDocRect, props, captureRectangleToFile])

  useEffect(() => {
    if (!dragArea) return

    const onMove = (e: PointerEvent) => {
      const pageScale = pageScaleRef.current.get(dragArea.pageIndex) ?? 1
      const dx = (e.clientX - dragArea.startClientX) / pageScale
      const dy = (e.clientY - dragArea.startClientY) / pageScale

      const r = dragArea.startLocalRect
      const moved = clampRectToPage(dragArea.pageIndex, {
        xMin: r.xMin + dx,
        xMax: r.xMax + dx,
        yMin: r.yMin + dy,
        yMax: r.yMax + dy
      })

      setDragArea((prev) => (prev ? { ...prev, liveLocalRect: moved } : prev))
    }

    const onUp = () => {
      const docRect = localToDocRect(dragArea.pageIndex, dragArea.liveLocalRect)
      const fileName = `fragment_${dragArea.areaId}_${getDateStamp()}.png`

      void (async () => {
        const configFile = await captureRectangleToFile(
          dragArea.pageIndex,
          dragArea.liveLocalRect,
          fileName
        )

        props.onUpdateAreaRectangle?.({
          areaId: dragArea.areaId,
          rectangle: docRect,
          configFile
        })
        setDragArea(null)
      })()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragArea, clampRectToPage, localToDocRect, props, captureRectangleToFile])

  useEffect(() => {
    if (!capture) return

    return capture.onCaptureArea((result: CaptureAreaEvent) => {
      const pending = pendingCaptureRef.current
      if (pending?.pageIndex === result.pageIndex && pending.onCaptured) {
        pendingCaptureRef.current = null
        pending.onCaptured(result)
        return
      }
      const filename =
        pending && pending.pageIndex === result.pageIndex
          ? pending.filename
          : `capture_p${result.pageIndex + 1}.png`

      const url = URL.createObjectURL(result.blob)

      setCapturedImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
      setCapturedImageName(filename)

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

      const host = viewportHostRef.current
      if (!host) return

      const el = areaElsRef.current.get(areaId)

      if (el) {
        if (isElementFullyVisibleInContainer(el, host)) return

        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        })
        return
      }

      const pageEl = document.querySelector(`.pdfv-page--p${a.pageIndex}`)

      if (pageEl instanceof HTMLElement) {
        if (isElementFullyVisibleInContainer(pageEl, host)) {
          return
        }
      }

      scrollRef.current?.scrollToPage({
        pageNumber: a.pageIndex + 1,
        behavior: 'smooth'
      })

      let tries = 0
      const maxTries = 20

      const tick = () => {
        const el = areaElsRef.current.get(areaId)
        if (el) {
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          })
          return
        }

        tries++
        if (tries < maxTries) {
          requestAnimationFrame(tick)
        }
      }

      requestAnimationFrame(tick)
    },
    [derivedAreas]
  )

  const getViewportScrollRoot = useCallback((): HTMLElement | null => {
    const host = viewportHostRef.current
    if (!host) return null

    const viewportEl = host.querySelector('.pdfv-viewport')
    return viewportEl instanceof HTMLElement ? viewportEl : host
  }, [])

  const scrollToSearchResult = useCallback(
    (resultIndex: number, behavior: ScrollBehavior = 'auto') => {
      const searchApi = searchRef.current
      const scrollApi = scrollRef.current

      if (!searchApi || resultIndex < 0) return

      const state = searchApi.getState()
      const result = state.results[resultIndex]
      const firstRect = result?.rects?.[0]

      if (!result || !firstRect) return

      const root = getViewportScrollRoot()
      if (!root) return

      const pageIndex = result.pageIndex

      const tryScroll = (attempt: number) => {
        const pageEl = root.querySelector(`.pdfv-page--p${pageIndex}`)

        if (!(pageEl instanceof HTMLElement)) {
          scrollApi?.scrollToPage({
            pageNumber: pageIndex + 1,
            behavior: 'auto'
          })

          if (attempt < 12) {
            window.requestAnimationFrame(() => tryScroll(attempt + 1))
          }

          return
        }

        const pageScale = pageScaleRef.current.get(pageIndex) ?? 1
        const rootRect = root.getBoundingClientRect()
        const pageRect = pageEl.getBoundingClientRect()

        const targetTop =
          root.scrollTop +
          (pageRect.top - rootRect.top) +
          firstRect.origin.y * pageScale -
          root.clientHeight / 3

        root.scrollTo({
          top: Math.max(0, targetTop),
          behavior
        })
      }

      tryScroll(0)
    },
    [getViewportScrollRoot]
  )

  type BrowseRequest = { areaId: number; seq: number } | null
  const [browseReq, setBrowseReq] = useState<BrowseRequest>(null)
  const browseSeqRef = useRef(0)
  const lastBrowseModeRef = useRef<PdfViewerMode | null>(null)
  const handledBrowseSeqRef = useRef<number | null>(null)

  useEffect(() => {
    if (props.mode.type !== 'BROWSE_AREA') {
      lastBrowseModeRef.current = props.mode
      handledBrowseSeqRef.current = null
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

    if (handledBrowseSeqRef.current === browseReq.seq) {
      return
    }

    handledBrowseSeqRef.current = browseReq.seq
    scrollToArea(browseReq.areaId)
  }, [browseReq, scrollToArea])

  useEffect(() => {
    const host = viewportHostRef.current
    if (!host) return

    const viewportEl = host.querySelector('.pdfv-viewport')
    const root = viewportEl instanceof HTMLElement ? viewportEl : host

    let raf = 0

    const parsePageIndex = (el: HTMLElement): number | null => {
      const cls = Array.from(el.classList).find((c) =>
        c.startsWith('pdfv-page--p')
      )
      if (!cls) return null

      const value = Number(cls.replace('pdfv-page--p', ''))
      return Number.isFinite(value) ? value : null
    }

    const updateCurrentPage = () => {
      const pageElements = Array.from(
        root.querySelectorAll<HTMLElement>('.pdfv-page')
      )

      if (pageElements.length === 0) {
        setCurrentPageIndex(null)
        return
      }

      const rootRect = root.getBoundingClientRect()
      const rootCenterY = rootRect.top + rootRect.height / 2

      let bestPageIndex: number | null = null
      let bestDistance = Number.POSITIVE_INFINITY

      for (const el of pageElements) {
        const pageIndex = parsePageIndex(el)
        if (pageIndex === null) continue

        const rect = el.getBoundingClientRect()
        const pageCenterY = rect.top + rect.height / 2
        const distance = Math.abs(pageCenterY - rootCenterY)

        if (distance < bestDistance) {
          bestDistance = distance
          bestPageIndex = pageIndex
        }
      }

      setCurrentPageIndex(bestPageIndex)
    }

    const requestUpdate = () => {
      window.cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(updateCurrentPage)
    }

    requestUpdate()

    root.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    const mutationObserver = new MutationObserver(requestUpdate)
    mutationObserver.observe(root, { childList: true, subtree: true })

    return () => {
      window.cancelAnimationFrame(raf)
      root.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      mutationObserver.disconnect()
    }
  }, [props.documentId])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return

      if (browseReq !== null) {
        e.preventDefault()
        e.stopPropagation()
        setBrowseReq(null)
        props.onBrowseAreaCancel?.()
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
      setDragArea(null)
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
      props.onBrowseAreaCancel?.()
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

  const captureAreaScreenshot = useCallback(
    (area: PdfArea & { pageIndex: number; localRect: Rectangle }) => {
      console.log('captureAreaScreenshot', {
        hasCapture: Boolean(capture),
        area
      })

      if (!capture) {
        return
      }

      const captureRect = toCaptureRect(area.localRect)

      const stamp = getDateStamp()

      pendingCaptureRef.current = {
        filename: `area_${area.id}_${stamp}.png`,
        pageIndex: area.pageIndex
      }

      capture.captureArea(area.pageIndex, captureRect)
    },
    [capture]
  )

  useEffect(() => {
    const searchApi = searchRef.current
    if (!searchApi) return

    let cancelled = false

    const unsubscribe = searchApi.onStateChange((state) => {
      if (cancelled) return

      const query = props.searchText?.trim() ?? ''
      const preferredIndex = preferredSearchResultIndexRef.current

      if (preferredIndex !== null) {
        const displayedResults = getDisplayedSearchResults(
          Array.isArray(state.results) ? state.results : [],
          query,
          props.searchWholeWord
        )
        const preferredDisplayedIndex = displayedResults.findIndex(
          (item) => item.actualIndex === preferredIndex
        )

        if (preferredDisplayedIndex >= 0) {
          displayedSearchResultsRef.current = displayedResults
          setCustomSearchResults(displayedResults)
          setCustomSearchActiveActualIndex(preferredIndex)
          pushSearchState(displayedResults.length, preferredDisplayedIndex + 1)
          pushSearchPending(Boolean(state.loading))
          return
        }
      }

      syncSearchState(state, query)
      pushSearchPending(Boolean(state.loading))
    })

    syncSearchState(searchApi.getState(), props.searchText?.trim() ?? '')

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [
    props.documentId,
    props.searchText,
    props.searchWholeWord,
    syncSearchState,
    pushSearchPending,
    pushSearchState
  ])

  useEffect(() => {
    const searchApi = searchRef.current
    if (!searchApi) return

    const query = props.searchText?.trim() ?? ''

    if (!query) {
      try {
        searchApi.stopSearch()
      } catch {
        // noop
      }
      lastSearchTextRef.current = ''
      handledSearchNextRequestRef.current = 0
      handledSearchPreviousRequestRef.current = 0
      preferredSearchResultIndexRef.current = null
      lastSearchPendingRef.current = null
      lastPushedSearchStateRef.current = {
        total: -1,
        activeIndex: -1
      }
      displayedSearchResultsRef.current = []
      setCustomSearchResults([])
      setCustomSearchActiveActualIndex(-1)
      suppressActiveResultEffectRef.current = false
      pushSearchState(0, 0)
      pushSearchPending(false)
      return
    }

    const isNewQuery = lastSearchTextRef.current !== query
    if (isNewQuery) {
      handledSearchNextRequestRef.current = props.searchNextRequest ?? 0
      handledSearchPreviousRequestRef.current = props.searchPreviousRequest ?? 0
      preferredSearchResultIndexRef.current = null
      pushSearchState(0, 0)
    }

    lastSearchTextRef.current = query

    let cancelled = false
    const runId = ++searchRunIdRef.current
    suppressActiveResultEffectRef.current = true
    pushSearchPending(true)

    try {
      searchApi.stopSearch()
    } catch {
      // noop
    }

    void (async () => {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 0)
      })

      if (cancelled || searchRunIdRef.current !== runId) {
        pushSearchPending(false)
        return
      }

      searchApi.startSearch()

      try {
        await Promise.race([
          searchApi.searchAllPages(query).toPromise(),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => {
              reject(new Error('search timeout'))
            }, SEARCH_TIMEOUT_MS)
          })
        ])
      } catch {
        try {
          searchApi.stopSearch()
        } catch {
          // noop
        }

        if (!cancelled && searchRunIdRef.current === runId) {
          const state = searchApi.getState() as {
            activeResultIndex?: number
            results?: Array<unknown>
          }

          syncSearchState(state, query)
          suppressActiveResultEffectRef.current = false
          pushSearchPending(false)
        }

        return
      }

      if (cancelled || searchRunIdRef.current !== runId) return

      const state = searchApi.getState() as {
        activeResultIndex?: number
        results?: SearchResult[]
      }

      const displayedResults = getDisplayedSearchResults(
        Array.isArray(state.results) ? state.results : [],
        query,
        props.searchWholeWord
      )
      const total = displayedResults.length
      const preferredIndex = preferredSearchResultIndexRef.current

      if (isNewQuery && total > 0) {
        const preferredDisplayedIndex =
          preferredIndex !== null
            ? displayedResults.findIndex(
                (item) => item.actualIndex === preferredIndex
              )
            : -1
        const resultIndex =
          preferredDisplayedIndex >= 0
            ? preferredIndex!
            : displayedResults[0].actualIndex

        syncSearchState(
          {
            ...state,
            activeResultIndex: resultIndex
          },
          query
        )

        window.requestAnimationFrame(() => {
          scrollToSearchResult(resultIndex, 'auto')
          suppressActiveResultEffectRef.current = false
        })
      } else if (preferredIndex !== null && total > 0) {
        const preferredDisplayedIndex = displayedResults.findIndex(
          (item) => item.actualIndex === preferredIndex
        )

        if (preferredDisplayedIndex >= 0) {
          syncSearchState(
            {
              ...state,
              activeResultIndex: preferredIndex
            },
            query
          )
        } else {
          syncSearchState(state, query)
        }

        suppressActiveResultEffectRef.current = false
      } else {
        syncSearchState(state, query)
        suppressActiveResultEffectRef.current = false
      }

      pushSearchPending(false)
    })()

    return () => {
      cancelled = true
      try {
        searchApi.stopSearch()
      } catch {
        // noop
      }
    }
  }, [
    props.documentId,
    props.searchText,
    props.searchCaseSensitive,
    props.searchWholeWord,
    pushSearchState,
    pushSearchPending,
    syncSearchState,
    scrollToSearchResult
  ])

  useEffect(() => {
    const searchApi = searchRef.current
    if (!searchApi) return

    let cancelled = false
    const query = props.searchText?.trim() ?? ''

    const unsubscribe = searchApi.onActiveResultChange((activeIndex) => {
      if (
        cancelled ||
        activeIndex < 0 ||
        suppressActiveResultEffectRef.current
      ) {
        return
      }

      const state = searchApi.getState()
      const { displayedResults, activeDisplayedIndex } =
        syncDisplayedSearchResults(state, query)

      if (displayedResults.length > 0 && activeDisplayedIndex >= 0) {
        pushSearchState(displayedResults.length, activeDisplayedIndex + 1)
      }

      window.requestAnimationFrame(() => {
        if (cancelled) return
        scrollToSearchResult(activeIndex)
      })
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [
    props.documentId,
    props.searchText,
    pushSearchState,
    scrollToSearchResult,
    syncDisplayedSearchResults
  ])

  useEffect(() => {
    const searchApi = searchRef.current
    if (!searchApi) return
    if (!props.searchNextRequest) return
    if (props.searchNextRequest === handledSearchNextRequestRef.current) return

    const query = props.searchText?.trim() ?? ''
    if (!query) return
    if (lastSearchTextRef.current !== query) return

    const total = searchTotalRef.current
    if (total <= 0) return

    handledSearchNextRequestRef.current = props.searchNextRequest

    const displayedResults = displayedSearchResultsRef.current
    const currentDisplayedIndex = displayedResults.findIndex(
      (item) => item.actualIndex === customSearchActiveActualIndex
    )
    const nextDisplayedIndex =
      currentDisplayedIndex >= 0
        ? (currentDisplayedIndex + 1) % displayedResults.length
        : 0
    const nextIndex = displayedResults[nextDisplayedIndex]?.actualIndex ?? -1
    if (nextIndex < 0) return

    searchApi.goToResult(nextIndex)
    preferredSearchResultIndexRef.current = nextIndex
    pushSearchState(total, nextDisplayedIndex + 1)

    window.requestAnimationFrame(() => {
      scrollToSearchResult(nextIndex)
    })
  }, [
    props.documentId,
    props.searchNextRequest,
    props.searchText,
    customSearchActiveActualIndex,
    pushSearchState,
    scrollToSearchResult
  ])

  useEffect(() => {
    const searchApi = searchRef.current
    if (!searchApi) return
    if (!props.searchPreviousRequest) return
    if (props.searchPreviousRequest === handledSearchPreviousRequestRef.current)
      return

    const query = props.searchText?.trim() ?? ''
    if (!query) return
    if (lastSearchTextRef.current !== query) return

    const total = searchTotalRef.current
    if (total <= 0) return

    handledSearchPreviousRequestRef.current = props.searchPreviousRequest

    const displayedResults = displayedSearchResultsRef.current
    const currentDisplayedIndex = displayedResults.findIndex(
      (item) => item.actualIndex === customSearchActiveActualIndex
    )
    const previousDisplayedIndex =
      currentDisplayedIndex >= 0
        ? (currentDisplayedIndex - 1 + displayedResults.length) %
          displayedResults.length
        : displayedResults.length - 1
    const previousIndex =
      displayedResults[previousDisplayedIndex]?.actualIndex ?? -1
    if (previousIndex < 0) return

    searchApi.goToResult(previousIndex)
    preferredSearchResultIndexRef.current = previousIndex
    pushSearchState(total, previousDisplayedIndex + 1)

    window.requestAnimationFrame(() => {
      scrollToSearchResult(previousIndex)
    })
  }, [
    props.documentId,
    props.searchPreviousRequest,
    props.searchText,
    customSearchActiveActualIndex,
    pushSearchState,
    scrollToSearchResult
  ])

  return (
    <div className="pdfv-layout">
      <PdfViewerThumbnails
        documentId={props.documentId}
        currentPageIndex={currentPageIndex}
        areas={derivedAreas}
        activeAreaId={activeAreaId}
        pageSizes={pageSizes}
      />

      <div ref={viewportHostRef} className="pdfv-body-host">
        <Dialog open={tooSmallOpen} onClose={() => setTooSmallOpen(false)}>
          <DialogTitle
            sx={(theme) => ({
              textAlign: 'center',
              color: theme.palette.mode === 'dark' ? gray[100] : gray[700]
            })}
          >
            Область слишком маленькая
          </DialogTitle>
          <DialogContent>
            <Alert
              severity="warning"
              sx={(theme) => ({
                backgroundColor:
                  theme.palette.mode === 'dark' ? red[200] : red[100],
                color: theme.palette.mode === 'dark' ? gray[100] : gray[700],
                '& .MuiAlert-icon': {
                  color: red[500]
                }
              })}
            >
              {tooSmallText}
            </Alert>
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

        <Dialog
          open={capturedImageUrl !== null}
          onClose={() => {
            if (capturedImageUrl) URL.revokeObjectURL(capturedImageUrl)
            setCapturedImageUrl(null)
            setCapturedImageName('')
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: (theme) => ({
              backgroundColor:
                theme.palette.mode === 'dark' ? gray[900] : gray[100],
              color: theme.palette.mode === 'dark' ? gray[100] : gray[700],
              borderRadius: 4
            })
          }}
        >
          <DialogTitle
            sx={{
              textAlign: 'center'
            }}
          >
            Предпросмотр снимка области
          </DialogTitle>
          <DialogContent dividers>
            {capturedImageUrl && (
              <img
                src={capturedImageUrl}
                alt={capturedImageName}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto',
                  margin: '0 auto'
                }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <ProjButton
              onClick={() => {
                if (!capturedImageUrl) return
                const a = document.createElement('a')
                a.href = capturedImageUrl
                a.download = capturedImageName || 'capture.png'
                document.body.appendChild(a)
                a.click()
                a.remove()
              }}
            >
              Скачать
            </ProjButton>
            <ProjButton
              variant="contained"
              onClick={() => {
                if (capturedImageUrl) URL.revokeObjectURL(capturedImageUrl)
                setCapturedImageUrl(null)
                setCapturedImageName('')
              }}
            >
              Закрыть
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
              const isDrawingMode =
                props.mode.type === 'CREATE_RECTANGLE' ||
                props.mode.type === 'UPDATE_AREA_RECTANGLE'

              const pageDynamicCssParts: string[] = []
              pageDynamicCssParts.push(
                `.${pageClass}{width:${fmtPx(width)};height:${fmtPx(height)};}`
              )

              for (const a of pageAreas) {
                const localRectForCss =
                  resize && resize.areaId === a.id
                    ? resize.liveLocalRect
                    : dragArea && dragArea.areaId === a.id
                      ? dragArea.liveLocalRect
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
                  className={`pdfv-page ${pageClass}${isDrawingMode ? ' pdfv-page--drawing' : ''}`}
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

                    <MarqueeCapture
                      documentId={props.documentId}
                      pageIndex={pageIndex}
                    />

                    {props.enableTiling && (
                      <TilingLayer
                        documentId={props.documentId}
                        pageIndex={pageIndex}
                      />
                    )}

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
                      {customSearchResults
                        .filter((item) => item.result.pageIndex === pageIndex)
                        .map((item) =>
                          mergeSearchHighlightRects(item.result.rects).map(
                            (rect, rectIndex) => {
                              const isActive =
                                item.actualIndex ===
                                customSearchActiveActualIndex

                              return (
                                <div
                                  key={`search-${item.actualIndex}-${rectIndex}`}
                                  className={`pdfv-search-highlight${isActive ? ' pdfv-search-highlight--active' : ''}`}
                                  style={{
                                    left: fmtPx(rect.origin.x * scale),
                                    top: fmtPx(rect.origin.y * scale),
                                    width: fmtPx(rect.size.width * scale),
                                    height: fmtPx(rect.size.height * scale)
                                  }}
                                />
                              )
                            }
                          )
                        )}

                      {pageAreas.map((a) => {
                        const isActive = activeAreaId === a.id

                        const clickableInThisMode =
                          !isTextMode && props.clickableAreas
                        const canInteract =
                          !isTextMode &&
                          (props.clickableAreas ||
                            props.withUpdateAreaButtons ||
                            props.withDeleteAreaButtons ||
                            props.withCaptureAreaButtons)

                        const localRectForUi =
                          resize && resize.areaId === a.id
                            ? resize.liveLocalRect
                            : dragArea && dragArea.areaId === a.id
                              ? dragArea.liveLocalRect
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
                            props.withUpdateAreaButtons ||
                            props.withCaptureAreaButtons)

                        const isEditingThisArea =
                          !isTextMode &&
                          props.mode.type === 'UPDATE_AREA_RECTANGLE' &&
                          props.mode.areaId === a.id

                        const areaPosClass = `pdfv-area--id-${a.id}`

                        const areaClassName = [
                          'pdfv-area',
                          areaPosClass,
                          isActive
                            ? 'pdfv-area--active'
                            : 'pdfv-area--inactive',
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
                            {!isTextMode && a.name.trim().length > 0 && (
                              <div
                                className="pdfv-area-label-wrap"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  props.onRenameAreaButtonClick?.({
                                    areaId: a.id
                                  })
                                }}
                              >
                                <div
                                  className="pdfv-area-label"
                                  title="Нажмите, чтобы изменить название"
                                >
                                  <span className="pdfv-area-label__text">
                                    {a.name}
                                  </span>
                                </div>
                              </div>
                            )}

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

                                {props.withCaptureAreaButtons && (
                                  <ProjButton
                                    variant="contained"
                                    type="button"
                                    sx={btnSx}
                                    title="Скриншот области"
                                    aria-label="Сделать скриншот области"
                                    disabled={!capture}
                                    onClick={() => {
                                      captureAreaScreenshot(a)
                                    }}
                                  >
                                    <PhotoCameraIcon fontSize="small" />
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

                                <div
                                  className="pdfv-drag-handle"
                                  onPointerDown={(e) => {
                                    e.stopPropagation()
                                    setDragArea({
                                      areaId: a.id,
                                      pageIndex,
                                      startClientX: e.clientX,
                                      startClientY: e.clientY,
                                      startLocalRect: localRectForUi,
                                      liveLocalRect: localRectForUi
                                    })
                                  }}
                                />
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
                          e.preventDefault()

                          const rect = (
                            e.currentTarget as HTMLDivElement
                          ).getBoundingClientRect()
                          const x = e.clientX - rect.left
                          const y = e.clientY - rect.top
                          setDraftPx({ pageIndex, x1: x, y1: y, x2: x, y2: y })
                        }}
                        onMouseMove={(e) => {
                          if (!draftPx || draftPx.pageIndex !== pageIndex)
                            return

                          e.preventDefault()

                          const rect = (
                            e.currentTarget as HTMLDivElement
                          ).getBoundingClientRect()
                          const x = e.clientX - rect.left
                          const y = e.clientY - rect.top
                          setDraftPx((prev) =>
                            prev ? { ...prev, x2: x, y2: y } : prev
                          )
                        }}
                        onMouseUp={(e) => {
                          e.preventDefault()

                          if (!draftPx || draftPx.pageIndex !== pageIndex)
                            return

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

                          const fileName = `fragment_p${pageIndex + 1}_${getDateStamp()}.png`

                          void (async () => {
                            const configFile = await captureRectangleToFile(
                              pageIndex,
                              localRectPts,
                              fileName
                            )

                            props.onCreateRectangle?.({
                              rectangle: docRect,
                              configFile
                            })
                            setDraftPx(null)
                          })()
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
    </div>
  )
}
