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
import Typography from '@mui/material/Typography'

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

const ChartHeight = 300
const ChartMargin = { top: 16, right: 28, bottom: 30, left: 28 }
const ReferenceLineStrokeWidth = 2.5

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
  isDarkMode
}: PlotFileViewerProps) {
  const [hoveredPoint, setHoveredPoint] =
    React.useState<ActivePlotPoint | null>(null)
  const [selectedPoint, setSelectedPoint] =
    React.useState<ActivePlotPoint | null>(null)

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
      sx={{
        height: '100%',
        minHeight: 360,
        p: 2,
        borderRadius: 1,
        bgcolor: chartBackgroundColor
      }}
    >
      <Typography variant="h6" align="center">
        {plot.title}
      </Typography>

      <Box
        sx={{
          height: ChartHeight,
          mt: 1,
          position: 'relative',
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
            data-plot-tooltip
            sx={{
              position: 'absolute',
              left: activePoint.chartX,
              top: activePoint.chartY,
              transform: 'translate(-50%, calc(-100% - 10px))',
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
              label={{
                value: `${plot.xTitle}${plot.xUnit ? `, ${plot.xUnit}` : ''}`,
                position: 'insideBottom',
                offset: -20
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
    </Box>
  )
}
