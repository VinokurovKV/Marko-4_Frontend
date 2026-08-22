// React
import * as React from 'react'
// Project
import { brand, gray } from '~/theme/themePrimitives'
// Recharts
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'
// Material UI
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
// Icons
import CloseIcon from '@mui/icons-material/Close'
import FullscreenIcon from '@mui/icons-material/Fullscreen'

export type Plot = {
  /** Название графика */
  title: string
  /** Название x-координаты */
  xTitle: string
  /** Название y-координаты */
  yTitle: string
  /** Единица измерения x-координаты (напр., `'сек'`) */
  xUnit: string
  /** Единица измерения  y-координаты */
  yUnit: string
  /** Массив точек в вида `[x,y]` */
  points: [number, number][]
}

export interface PlotFileViewerProps {
  fileName: string
  fileText: string
  isDarkMode: boolean
  containerRef?: React.Ref<HTMLDivElement>
}

type PlotChartPoint = {
  xValue: number
  yValue: number
}

type ActivePlotPoint = PlotChartPoint & {
  chartX: number
  chartY: number
}

type PlotDotProps = {
  cx?: number
  cy?: number
  payload?: PlotChartPoint
}

const ChartMargin = { top: 6, right: 24, bottom: 6, left: 24 }
const XAxisHeight = 42
const ReferenceLineStrokeWidth = 2.5
const TooltipGap = 10
const TooltipContainerGap = 8

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isStringOrUndefined(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}

function isPlotPoint(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    isFiniteNumber(value[0]) &&
    isFiniteNumber(value[1])
  )
}

function isPlot(value: unknown): value is Plot {
  if (value === null || typeof value !== 'object') return false
  const candidate = value as Partial<Plot>
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.xTitle === 'string' &&
    typeof candidate.yTitle === 'string' &&
    isStringOrUndefined(candidate.xUnit) &&
    isStringOrUndefined(candidate.yUnit) &&
    Array.isArray(candidate.points) &&
    candidate.points.length > 0 &&
    candidate.points.every(isPlotPoint)
  )
}

function formatCoordinate(value: number, unit?: string) {
  const formattedValue = Number.isInteger(value)
    ? value.toString()
    : value.toLocaleString('ru-RU', { maximumFractionDigits: 4 })
  return unit === undefined || unit.length === 0
    ? formattedValue
    : `${formattedValue} ${unit}`
}

function isSamePoint(
  firstPoint: ActivePlotPoint | null,
  secondPoint: ActivePlotPoint
) {
  return (
    firstPoint !== null &&
    firstPoint.xValue === secondPoint.xValue &&
    firstPoint.yValue === secondPoint.yValue
  )
}

export function PlotFileViewer({
  fileName,
  fileText,
  isDarkMode,
  containerRef
}: PlotFileViewerProps) {
  const [hoveredPoint, setHoveredPoint] =
    React.useState<ActivePlotPoint | null>(null)
  const [selectedPoint, setSelectedPoint] =
    React.useState<ActivePlotPoint | null>(null)
  const [isFullscreenOpen, setIsFullscreenOpen] = React.useState(false)
  const chartContainerRef = React.useRef<HTMLDivElement | null>(null)
  const tooltipRef = React.useRef<HTMLDivElement | null>(null)
  const [tooltipSize, setTooltipSize] = React.useState<{
    width: number
    height: number
  } | null>(null)

  const activePoint = selectedPoint ?? hoveredPoint
  const chartColor = isDarkMode ? brand[300] : brand[500]
  const chartBackgroundColor = isDarkMode ? gray[900] : gray[50]
  const tooltipBackgroundColor = isDarkMode ? gray[700] : gray[50]

  const plot = React.useMemo(() => {
    try {
      const parsed = JSON.parse(fileText) as unknown
      return isPlot(parsed) ? parsed : null
    } catch {
      return null
    }
  }, [fileText])

  const chartData = React.useMemo<PlotChartPoint[]>(
    () =>
      plot?.points.map(([xValue, yValue]) => ({
        xValue,
        yValue
      })) ?? [],
    [plot]
  )

  const chartExtents = React.useMemo(() => {
    const xValues = chartData.map((point) => point.xValue)
    const yValues = chartData.map((point) => point.yValue)
    return {
      xMin: Math.min(...xValues),
      xMax: Math.max(...xValues),
      yMin: Math.min(...yValues),
      yMax: Math.max(...yValues)
    }
  }, [chartData])

  React.useLayoutEffect(() => {
    if (activePoint === null) {
      setTooltipSize(null)
      return
    }

    const animationFrameId = requestAnimationFrame(() => {
      const tooltip = tooltipRef.current
      if (tooltip === null) return
      const tooltipRect = tooltip.getBoundingClientRect()
      setTooltipSize({
        width: tooltipRect.width,
        height: tooltipRect.height
      })
    })

    return () => cancelAnimationFrame(animationFrameId)
  }, [activePoint])

  const tooltipPosition = React.useMemo(() => {
    const chartContainer = chartContainerRef.current
    if (
      activePoint === null ||
      tooltipSize === null ||
      chartContainer === null
    ) {
      return null
    }

    const minLeft = tooltipSize.width / 2 + TooltipContainerGap
    const maxLeft =
      chartContainer.clientWidth - tooltipSize.width / 2 - TooltipContainerGap
    const left =
      maxLeft > minLeft
        ? Math.min(Math.max(activePoint.chartX, minLeft), maxLeft)
        : chartContainer.clientWidth / 2
    const topAbove = activePoint.chartY - tooltipSize.height - TooltipGap
    const topBelow = activePoint.chartY + TooltipGap
    const top =
      topAbove >= TooltipContainerGap
        ? topAbove
        : Math.min(
            topBelow,
            chartContainer.clientHeight -
              tooltipSize.height -
              TooltipContainerGap
          )

    return {
      left,
      top: Math.max(top, TooltipContainerGap)
    }
  }, [activePoint, tooltipSize])

  if (plot === null) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" align="center">
          Файл «{fileName}» не соответствует формату .plot.json
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        minHeight: 320,
        px: 1.5,
        pt: 1,
        pb: 2,
        borderRadius: 1,
        bgcolor: chartBackgroundColor,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Typography
          variant="h6"
          align="center"
          sx={{ fontSize: '1rem', lineHeight: 1.2, px: 5 }}
        >
          {plot.title}
        </Typography>
        <Tooltip title="Открыть график во весь экран">
          <IconButton
            size="small"
            onClick={() => setIsFullscreenOpen(true)}
            sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              zIndex: 2,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <FullscreenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        ref={chartContainerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          mt: 1,
          position: 'relative',
          overflow: 'hidden',
          '& .recharts-wrapper, & .recharts-surface': {
            outline: 'none'
          },
          '& .recharts-surface:focus': {
            outline: 'none'
          }
        }}
        onMouseDown={(event) => {
          const target = event.target
          if (
            target instanceof Element &&
            target.closest('[data-plot-tooltip]') !== null
          ) {
            return
          }
          event.preventDefault()
        }}
      >
        {activePoint !== null && (
          <Box
            ref={tooltipRef}
            data-plot-tooltip
            sx={{
              position: 'absolute',
              left: tooltipPosition?.left ?? activePoint.chartX,
              top: tooltipPosition?.top ?? activePoint.chartY,
              transform:
                tooltipPosition === null
                  ? 'translate(-50%, calc(-100% - 10px))'
                  : 'translateX(-50%)',
              zIndex: 2,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: tooltipBackgroundColor,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 2,
              pointerEvents: selectedPoint === null ? 'none' : 'auto',
              userSelect: 'text',
              whiteSpace: 'nowrap'
            }}
          >
            <Typography variant="body2">
              ({formatCoordinate(activePoint.xValue, plot.xUnit)};{' '}
              {formatCoordinate(activePoint.yValue, plot.yUnit)})
            </Typography>
          </Box>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={ChartMargin}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
            <XAxis
              dataKey="xValue"
              type="number"
              domain={[chartExtents.xMin, chartExtents.xMax]}
              height={XAxisHeight}
              label={{
                value: `${plot.xTitle}${plot.xUnit ? `, ${plot.xUnit}` : ''}`,
                position: 'insideBottom',
                offset: 0
              }}
            />
            <YAxis
              dataKey="yValue"
              type="number"
              domain={[chartExtents.yMin, chartExtents.yMax]}
              label={{
                value: `${plot.yTitle}${plot.yUnit ? `, ${plot.yUnit}` : ''}`,
                angle: -90,
                position: 'insideLeft'
              }}
            />
            {selectedPoint !== null && (
              <>
                <ReferenceLine
                  segment={[
                    { x: chartExtents.xMin, y: selectedPoint.yValue },
                    { x: selectedPoint.xValue, y: selectedPoint.yValue }
                  ]}
                  stroke={chartColor}
                  strokeWidth={ReferenceLineStrokeWidth}
                  strokeDasharray="5 5"
                  opacity={0.8}
                />
                <ReferenceLine
                  segment={[
                    { x: selectedPoint.xValue, y: selectedPoint.yValue },
                    { x: selectedPoint.xValue, y: chartExtents.yMin }
                  ]}
                  stroke={chartColor}
                  strokeWidth={ReferenceLineStrokeWidth}
                  strokeDasharray="5 5"
                  opacity={0.8}
                />
              </>
            )}
            <Line
              type="monotone"
              dataKey="yValue"
              stroke={chartColor}
              strokeWidth={2}
              dot={(props: PlotDotProps) => {
                if (
                  props.cx === undefined ||
                  props.cy === undefined ||
                  props.payload === undefined
                ) {
                  return <circle />
                }
                const point: ActivePlotPoint = {
                  ...props.payload,
                  chartX: props.cx,
                  chartY: props.cy
                }
                const isSelectedPoint = isSamePoint(selectedPoint, point)
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={isSelectedPoint ? 7 : 4}
                    fill={chartColor}
                    stroke={isSelectedPoint ? gray[50] : chartColor}
                    strokeWidth={isSelectedPoint ? 2 : 1}
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    onMouseEnter={() => {
                      if (selectedPoint === null) setHoveredPoint(point)
                    }}
                    onMouseLeave={() => {
                      if (selectedPoint === null) setHoveredPoint(null)
                    }}
                    onClick={() => {
                      setHoveredPoint(null)
                      setSelectedPoint((currentPoint) =>
                        isSamePoint(currentPoint, point) ? null : point
                      )
                    }}
                  />
                )
              }}
              activeDot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      <Dialog
        fullScreen
        open={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
      >
        <Box
          sx={{
            height: '100vh',
            p: 2,
            bgcolor: chartBackgroundColor,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ position: 'relative', mb: 1 }}>
            <Typography variant="h5" align="center">
              {plot.title}
            </Typography>
            <IconButton
              onClick={() => setIsFullscreenOpen(false)}
              sx={{ position: 'absolute', top: 0, right: 0 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={ChartMargin}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                <XAxis
                  dataKey="xValue"
                  type="number"
                  domain={[chartExtents.xMin, chartExtents.xMax]}
                  height={XAxisHeight}
                  label={{
                    value: `${plot.xTitle}${plot.xUnit ? `, ${plot.xUnit}` : ''}`,
                    position: 'insideBottom',
                    offset: 0
                  }}
                />
                <YAxis
                  dataKey="yValue"
                  type="number"
                  domain={[chartExtents.yMin, chartExtents.yMax]}
                  label={{
                    value: `${plot.yTitle}${plot.yUnit ? `, ${plot.yUnit}` : ''}`,
                    angle: -90,
                    position: 'insideLeft'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="yValue"
                  stroke={chartColor}
                  strokeWidth={2}
                  dot={{ r: 4, fill: chartColor, stroke: chartColor }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}
