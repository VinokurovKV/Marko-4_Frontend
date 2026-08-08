// Project
import { TimePointTypeEnum } from '@common/enums'
import type { StorageStatusStringWrapDto } from '@common/dtos/server-api/monitoring.dto'
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers'
import { useNotifier } from '~/providers/notifier'
import { serverConnector } from '~/server-connector'
// React
import * as React from 'react'
// Recharts
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'
// Material UI
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

function toDateTimeLocal(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toBytes(value: string | undefined) {
  return value === undefined ? 0 : Number(value)
}

function formatBytes(value: number) {
  if (!Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']
  let prepared = abs
  let unitIndex = 0
  while (prepared >= 1024 && unitIndex < units.length - 1) {
    prepared /= 1024
    unitIndex += 1
  }
  const sign = value < 0 ? '-' : ''
  return `${sign}${prepared.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}

function formatNumber(value: string | number | undefined) {
  if (value === undefined) return '—'
  return Number(value).toLocaleString('ru-RU')
}

function formatTime(value: Date | string | undefined) {
  return value === undefined
    ? '\u2014'
    : new Date(value).toLocaleString('ru-RU')
}

function toChartLabel(value: string) {
  return value.replace(/^\S+: /, '').split(' / ')[0]
}

function splitChartLabel(value: string, maxWidth: number) {
  const parts = value.split(' ')
  const approximateWidth = value.length * 6
  if (parts.length < 2 || approximateWidth <= maxWidth) return [value]
  return [parts.slice(0, -1).join(' '), parts.at(-1)!]
}

function MiniComparisonChart(props: {
  beforeValue: number
  afterValue: number
  beforeLabel: string
  afterLabel: string
  deltaLabel: string
  positiveIsGood?: boolean
  beforeName?: string
  afterName?: string
}) {
  const theme = useTheme()
  const isPositive = props.afterValue >= props.beforeValue
  const color =
    props.positiveIsGood === undefined
      ? theme.palette.primary.main
      : isPositive === props.positiveIsGood
        ? theme.palette.success.main
        : theme.palette.error.main
  const renderChartLabel = (labelProps: unknown) => {
    const { x, y, width, height, value } = labelProps as {
      x?: number
      y?: number
      width?: number
      height?: number
      value?: string
    }
    if (x === undefined || y === undefined || width === undefined) return null
    const isInside = height !== undefined && height >= 24
    const textColor = isInside ? '#fff' : theme.palette.text.primary
    const lines = splitChartLabel(String(value ?? ''), width - 4)
    const firstLineY = isInside ? y + 13 : y - (lines.length === 1 ? 4 : 14)

    return (
      <text
        x={x + width / 2}
        y={firstLineY}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill={textColor}
      >
        {lines.map((line, index) => (
          <tspan key={line} x={x + width / 2} dy={index === 0 ? 0 : 11}>
            {line}
          </tspan>
        ))}
      </text>
    )
  }

  const maxValue = Math.max(props.beforeValue, props.afterValue, 1)
  const minVisibleValue = maxValue * 0.03

  const data = [
    {
      name: props.beforeName ?? '\u0422\u043e\u0433\u0434\u0430',
      value:
        props.beforeValue > 0
          ? Math.max(props.beforeValue, minVisibleValue)
          : props.beforeValue,
      label: toChartLabel(props.beforeLabel),
      fullLabel: props.beforeLabel
    },
    {
      name: props.afterName ?? '\u0421\u0435\u0439\u0447\u0430\u0441',
      value:
        props.afterValue > 0
          ? Math.max(props.afterValue, minVisibleValue)
          : props.afterValue,
      label: toChartLabel(props.afterLabel),
      fullLabel: props.afterLabel
    }
  ]

  return (
    <Box key={theme.palette.mode} sx={{ position: 'relative', mt: 0.5 }}>
      <ResponsiveContainer width="100%" height={92}>
        <BarChart
          data={data}
          margin={{ top: 18, right: 8, bottom: 0, left: 8 }}
        >
          <CartesianGrid
            stroke={theme.palette.divider}
            strokeOpacity={0.75}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
          />
          <YAxis hide domain={[0, (dataMax: number) => dataMax * 1.18]} />
          <Bar
            dataKey="value"
            fill={color}
            radius={[8, 8, 0, 0]}
            barSize={48}
            isAnimationActive={false}
          >
            <LabelList dataKey="label" content={renderChartLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <Typography
        sx={{
          position: 'absolute',
          top: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          px: 0.75,
          py: 0.2,
          borderRadius: 1,
          bgcolor: color,
          border: '1px solid',
          borderColor: color,
          boxShadow: `0 0 4px ${color}`,
          fontSize: '0.68rem',
          fontWeight: 700,
          lineHeight: 1.15,
          color: theme.palette.getContrastText(color),
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}
      >
        {'\u0394'} {props.deltaLabel}
      </Typography>
    </Box>
  )
}

function MetricCard(props: {
  title: string
  before: string
  after: string
  delta: string
  chart: {
    beforeValue: number
    afterValue: number
    positiveIsGood?: boolean
    beforeName?: string
    afterName?: string
  }
}) {
  return (
    <Card
      variant="outlined"
      sx={{ height: 160, maxHeight: 160, overflow: 'hidden' }}
    >
      <CardContent sx={{ pt: 2.25, pb: 0.75, '&:last-child': { pb: 0.75 } }}>
        <Typography variant="h6" sx={{ mb: 0.25, fontSize: '1.05rem' }}>
          {props.title}
        </Typography>
        <MiniComparisonChart
          {...props.chart}
          beforeLabel={props.before}
          afterLabel={props.after}
          deltaLabel={props.delta}
        />
      </CardContent>
    </Card>
  )
}

export function SystemMonitoringScreen() {
  const notifier = useNotifier()
  const now = React.useMemo(() => new Date(), [])
  const [startTime, setStartTime] = React.useState(
    toDateTimeLocal(new Date(now.getTime() - 60 * 60 * 1000))
  )
  const [endTime, setEndTime] = React.useState(toDateTimeLocal(now))
  const [loading, setLoading] = React.useState(false)
  const [startState, setStartState] =
    React.useState<StorageStatusStringWrapDto | null>(null)
  const [endState, setEndState] =
    React.useState<StorageStatusStringWrapDto | null>(null)
  const [message, setMessage] = React.useState(
    'Выберите точки времени и нажмите «Сравнить»'
  )
  const [availableFrom, setAvailableFrom] =
    React.useState<StorageStatusStringWrapDto | null>(null)
  const [availableTo, setAvailableTo] =
    React.useState<StorageStatusStringWrapDto | null>(null)

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'мониторинг системы',
        href: '/system-monitoring',
        Icon: MonitorHeartIcon
      }
    ],
    []
  )

  const loadAvailability = React.useCallback(async () => {
    const [first, last] = await Promise.allSettled([
      serverConnector.findFirstStorageStatus({
        time: new Date(0),
        timePoint: TimePointTypeEnum.AFTER
      }),
      serverConnector.findFirstStorageStatus({
        time: new Date(),
        timePoint: TimePointTypeEnum.BEFORE
      })
    ])

    if (first.status === 'fulfilled') {
      setAvailableFrom(first.value)
      setStartTime(toDateTimeLocal(new Date(first.value.time)))
    }
    if (last.status === 'fulfilled') {
      setAvailableTo(last.value)
      setEndTime(toDateTimeLocal(new Date(last.value.time)))
    }
  }, [])

  React.useEffect(() => {
    void loadAvailability()
  }, [loadAvailability])

  const loadComparison = React.useCallback(async () => {
    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    setStartState(null)
    setEndState(null)

    if (
      !Number.isFinite(startDate.getTime()) ||
      !Number.isFinite(endDate.getTime())
    ) {
      setMessage('Выберите обе точки времени')
      return
    }

    if (startDate.getTime() > endDate.getTime()) {
      setMessage('Начальная точка должна быть раньше конечной')
      return
    }

    if (
      availableFrom !== null &&
      startDate.getTime() + 60 * 1000 <= new Date(availableFrom.time).getTime()
    ) {
      setMessage('Начальная точка раньше первого снимка мониторинга')
      return
    }

    if (
      availableTo !== null &&
      endDate.getTime() >= new Date(availableTo.time).getTime() + 60 * 1000
    ) {
      setMessage('Конечная точка позже последнего снимка мониторинга')
      return
    }

    setMessage('')
    setLoading(true)
    const [from, to] = await Promise.allSettled([
      serverConnector.findFirstStorageStatus({
        time: startDate,
        timePoint: TimePointTypeEnum.AFTER
      }),
      serverConnector.findFirstStorageStatus({
        time: endDate,
        timePoint: TimePointTypeEnum.BEFORE
      })
    ])
    setLoading(false)

    if (from.status === 'fulfilled' && to.status === 'fulfilled') {
      setStartState(from.value)
      setEndState(to.value)
      return
    }

    setMessage('Не удалось найти снимки мониторинга для выбранного периода')
  }, [availableFrom, availableTo, endTime, startTime])

  const loadCurrent = React.useCallback(async () => {
    setMessage('')
    setLoading(true)
    try {
      const current = await serverConnector.storageStatus({ writeToDB: false })
      setEndState(current)
      setEndTime(toDateTimeLocal(new Date()))
    } catch (error) {
      setEndState(null)
      setMessage('Не удалось получить текущее состояние')
      notifier.showError(error, 'не удалось получить текущее состояние')
    } finally {
      setLoading(false)
    }
  }, [notifier])

  const metrics = React.useMemo(() => {
    if (startState === null || endState === null) return null
    const memBefore = toBytes(startState.memUsed)
    const memAfter = toBytes(endState.memUsed)
    const diskBefore = toBytes(startState.diskAvailable)
    const diskAfter = toBytes(endState.diskAvailable)
    const requestsBefore = toBytes(startState.requestsCnt)
    const requestsAfter = toBytes(endState.requestsCnt)
    const requestBytesDelta =
      toBytes(endState.requestsTotalSizeBytes) -
      toBytes(startState.requestsTotalSizeBytes)
    const responseBytesDelta =
      toBytes(endState.responsesTotalSizeBytes) -
      toBytes(startState.responsesTotalSizeBytes)

    return [
      {
        title: 'Память',
        before: `${formatBytes(memBefore)} / ${formatBytes(toBytes(startState.memTotal))}`,
        after: `${formatBytes(memAfter)} / ${formatBytes(toBytes(endState.memTotal))}`,
        delta: formatBytes(memAfter - memBefore),
        chart: {
          beforeValue: memBefore,
          afterValue: memAfter,
          positiveIsGood: false
        }
      },
      {
        title: 'Диск доступно',
        before: `${formatBytes(diskBefore)} / ${formatBytes(toBytes(startState.diskTotal))}`,
        after: `${formatBytes(diskAfter)} / ${formatBytes(toBytes(endState.diskTotal))}`,
        delta: formatBytes(diskAfter - diskBefore),
        chart: {
          beforeValue: diskBefore,
          afterValue: diskAfter,
          positiveIsGood: true
        }
      },
      {
        title: 'Запросы',
        before: formatNumber(startState.requestsCnt),
        after: formatNumber(endState.requestsCnt),
        delta: formatNumber(requestsAfter - requestsBefore),
        chart: {
          beforeValue: requestsBefore,
          afterValue: requestsAfter
        }
      },
      {
        title: 'Трафик за период',
        before: `вход: ${formatBytes(requestBytesDelta)}`,
        after: `выход: ${formatBytes(responseBytesDelta)}`,
        delta: formatBytes(responseBytesDelta - requestBytesDelta),
        chart: {
          beforeValue: Math.max(0, requestBytesDelta),
          afterValue: Math.max(0, responseBytesDelta),
          beforeName: '\u0412\u0445\u043e\u0434',
          afterName: '\u0412\u044b\u0445\u043e\u0434'
        }
      }
    ]
  }, [endState, startState])

  return (
    <LayoutScreenContainer
      title="мониторинг системы"
      breadcrumbsItems={breadcrumbsItems}
    >
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent sx={{ pt: 2.75, pb: 1, '&:last-child': { pb: 1 } }}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              flexWrap="wrap"
            >
              <TextField
                label="начальная точка"
                type="datetime-local"
                size="small"
                sx={{
                  '& .MuiInputBase-root': { height: 24, fontSize: '0.75rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.75rem' }
                }}
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                slotProps={{
                  htmlInput: {
                    min:
                      availableFrom === null
                        ? undefined
                        : toDateTimeLocal(new Date(availableFrom.time)),
                    max:
                      availableTo === null
                        ? undefined
                        : toDateTimeLocal(new Date(availableTo.time))
                  },
                  inputLabel: { shrink: true }
                }}
              />
              <TextField
                label="конечная точка"
                type="datetime-local"
                size="small"
                sx={{
                  '& .MuiInputBase-root': { height: 24, fontSize: '0.75rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.75rem' }
                }}
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                slotProps={{
                  htmlInput: {
                    min:
                      availableFrom === null
                        ? undefined
                        : toDateTimeLocal(new Date(availableFrom.time)),
                    max:
                      availableTo === null
                        ? undefined
                        : toDateTimeLocal(new Date(availableTo.time))
                  },
                  inputLabel: { shrink: true }
                }}
              />
              <Button
                variant="contained"
                size="small"
                sx={{ height: 24, fontSize: '0.65rem' }}
                disabled={loading}
                onClick={() => void loadComparison()}
              >
                Сравнить
              </Button>
              <Button
                size="small"
                sx={{ height: 24, fontSize: '0.65rem' }}
                disabled={loading}
                onClick={() => void loadCurrent()}
              >
                Сейчас
              </Button>
            </Stack>
            {availableFrom !== null && availableTo !== null ? (
              <Typography
                color="text.secondary"
                sx={{ mt: 1, fontSize: '0.65rem', lineHeight: 1.2 }}
              >
                Данные доступны с {formatTime(availableFrom.time)}
              </Typography>
            ) : null}
          </CardContent>
        </Card>

        {loading ? (
          <Typography color="text.secondary">
            Загрузка мониторинга...
          </Typography>
        ) : metrics === null ? (
          <Typography color="text.secondary">{message}</Typography>
        ) : (
          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
            useFlexGap
            sx={{ alignItems: 'stretch', maxHeight: 336, overflow: 'hidden' }}
          >
            {metrics.map((metric) => (
              <Stack
                key={metric.title}
                sx={{
                  width: { xs: '100%', md: 'calc(50% - 8px)' },
                  height: 160
                }}
              >
                <MetricCard {...metric} />
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </LayoutScreenContainer>
  )
}
