// Project
import { TimePointTypeEnum } from '@common/enums'
import type { StorageStatusStringWrapDto } from '@common/dtos/server-api/monitoring.dto'
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers'
import { serverConnector } from '~/server-connector'
import { FormDateTime } from '~/components/forms/common/form-date-time'
import { brand, green, orange, red } from '~/theme/themePrimitives'
// React
import * as React from 'react'
// Recharts
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'
// Material UI
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Tooltip from '@mui/material/Tooltip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'

const MONITORING_START_TIME_LOCAL_STORAGE_KEY = 'SYSTEM_MONITORING_START_TIME'
const MONITORING_END_TIME_LOCAL_STORAGE_KEY = 'SYSTEM_MONITORING_END_TIME'

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

function subtractMonth(date: Date) {
  const result = new Date(date)
  result.setMonth(result.getMonth() - 1)
  return result
}

function getSavedMonitoringTime(key: string) {
  const value = localStorage.getItem(key)
  if (value === null) return undefined
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : undefined
}

function saveMonitoringTime(key: string, value: Date | undefined) {
  if (value === undefined || !Number.isFinite(value.getTime())) {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, value.toISOString())
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

function getFreeResourceColor(
  freeValue: number,
  totalValue: number,
  mode: 'light' | 'dark'
) {
  const percent = totalValue === 0 ? 0 : (freeValue / totalValue) * 100
  if (percent < 25) return mode === 'dark' ? red[300] : red[400]
  if (percent < 75) return mode === 'dark' ? orange[300] : orange[400]
  return mode === 'dark' ? green[300] : green[400]
}

function getUsedResourceColor(
  usedValue: number,
  totalValue: number,
  mode: 'light' | 'dark'
) {
  return getFreeResourceColor(totalValue - usedValue, totalValue, mode)
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
  beforeColor?: string
  afterColor?: string
  labelColor?: string
  deltaLabelColor?: string
}) {
  const theme = useTheme()
  const isPositive = props.afterValue >= props.beforeValue
  const defaultColor =
    props.positiveIsGood === undefined
      ? theme.palette.primary.main
      : isPositive === props.positiveIsGood
        ? theme.palette.success.main
        : theme.palette.error.main
  const deltaColor = props.afterColor ?? props.beforeColor ?? defaultColor
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
    const textColor = isInside
      ? (props.labelColor ?? '#fff')
      : theme.palette.text.primary
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
      name: props.beforeName ?? 'Начало',
      value:
        props.beforeValue > 0
          ? Math.max(props.beforeValue, minVisibleValue)
          : props.beforeValue,
      label: toChartLabel(props.beforeLabel),
      fullLabel: props.beforeLabel,
      color: props.beforeColor ?? defaultColor
    },
    {
      name: props.afterName ?? 'Конец',
      value:
        props.afterValue > 0
          ? Math.max(props.afterValue, minVisibleValue)
          : props.afterValue,
      label: toChartLabel(props.afterLabel),
      fullLabel: props.afterLabel,
      color: props.afterColor ?? defaultColor
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
            radius={[8, 8, 0, 0]}
            barSize={48}
            isAnimationActive={false}
          >
            {data.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
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
          bgcolor: deltaColor,
          border: '1px solid',
          borderColor: deltaColor,
          boxShadow: `0 0 4px ${deltaColor}`,
          fontSize: '0.68rem',
          fontWeight: 700,
          lineHeight: 1.15,
          color:
            props.deltaLabelColor ?? theme.palette.getContrastText(deltaColor),
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
  tooltip?: string
  before: string
  after: string
  delta: string
  chart: {
    beforeValue: number
    afterValue: number
    positiveIsGood?: boolean
    beforeName?: string
    afterName?: string
    beforeColor?: string
    afterColor?: string
    labelColor?: string
    deltaLabelColor?: string
  }
}) {
  return (
    <Card
      variant="outlined"
      sx={{ height: 160, maxHeight: 160, overflow: 'hidden' }}
    >
      <CardContent sx={{ pt: 2.25, pb: 0.75, '&:last-child': { pb: 0.75 } }}>
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="h6" sx={{ mb: 0.25, fontSize: '1.05rem' }}>
            {props.title}
          </Typography>
          {props.tooltip !== undefined ? (
            <Tooltip title={props.tooltip}>
              <HelpOutlineIcon
                fontSize="small"
                sx={{ color: 'text.secondary' }}
              />
            </Tooltip>
          ) : null}
        </Stack>
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

const monitoringDatePickerPaperSx = {
  zoom: 0.78,
  '& .MuiPickersLayout-root': {
    minWidth: 0,
    width: 'fit-content',
    maxWidth: 560
  },
  '& .MuiDateCalendar-root': {
    width: 228,
    height: 230
  },
  '& .MuiPickersCalendarHeader-root': {
    minHeight: 30,
    maxHeight: 30,
    px: 1,
    mt: 0,
    mb: 0
  },
  '& .MuiPickersCalendarHeader-label': {
    fontSize: '0.8rem'
  },
  '& .MuiPickersArrowSwitcher-button': {
    p: 0.25
  },
  '& .MuiDayCalendar-header': {
    px: 1
  },
  '& .MuiDayCalendar-weekDayLabel': {
    width: 26,
    height: 22,
    fontSize: '0.7rem'
  },
  '& .MuiDayCalendar-weekContainer': {
    mx: 1,
    my: 0
  },
  '& .MuiPickersDay-root': {
    width: 26,
    height: 26,
    fontSize: '0.7rem'
  },
  '& .MuiMultiSectionDigitalClock-root': {
    maxHeight: 178
  },
  '& .MuiMultiSectionDigitalClockSection-root': {
    width: 42
  },
  '& .MuiMultiSectionDigitalClockSection-item': {
    minHeight: 24,
    fontSize: '0.7rem'
  },
  '& .MuiDialogActions-root': {
    px: 1,
    py: 0.5
  },
  '& .MuiDialogActions-root .MuiButton-root': {
    minHeight: 28,
    fontSize: '0.75rem'
  }
}

const monitoringDatePickerPopperSx = {
  '& .MuiPaper-root': {
    zoom: 0.78,
    width: 'fit-content',
    maxWidth: 560
  }
}

const monitoringDateTimeFieldSx = {
  width: '100%',
  '& .MuiPickersInputBase-root': {
    height: 24,
    fontSize: '0.75rem'
  },
  '& .MuiFormLabel-root': {
    fontSize: '0.75rem',
    transform: 'translate(13px, 2px)'
  },
  '& .MuiFormLabel-root.Mui-focused, & .MuiFormLabel-root.MuiFormLabel-filled':
    {
      transform: 'translate(14px, -7px) scale(0.65)'
    },
  '& + .MuiFormHelperText-root': {
    mt: -10,
    lineHeight: 1,
    minHeight: 0
  }
}

export function SystemMonitoringScreen() {
  const theme = useTheme()
  const now = React.useMemo(() => new Date(), [])
  const [startTime, setStartTime] = React.useState<Date | undefined>(
    new Date(now.getTime() - 60 * 60 * 1000)
  )
  const [endTime, setEndTime] = React.useState<Date | undefined>(now)
  const [endTimeIsCurrent, setEndTimeIsCurrent] = React.useState(true)
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

  const [maxSelectableTime, setMaxSelectableTime] = React.useState(() =>
    dayjs()
  )

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
      const firstAvailableTime = new Date(first.value.time)
      const monthAgoTime = subtractMonth(new Date())
      setAvailableFrom(first.value)
      const calculatedStartTime =
        firstAvailableTime.getTime() < monthAgoTime.getTime()
          ? monthAgoTime
          : firstAvailableTime
      setStartTime(
        getSavedMonitoringTime(MONITORING_START_TIME_LOCAL_STORAGE_KEY) ??
          calculatedStartTime
      )
    }
    if (last.status === 'fulfilled') {
      setAvailableTo(last.value)
      const savedEndTime = getSavedMonitoringTime(
        MONITORING_END_TIME_LOCAL_STORAGE_KEY
      )
      setEndTime(savedEndTime ?? new Date(last.value.time))
      setEndTimeIsCurrent(savedEndTime === undefined)
    }
  }, [])

  React.useEffect(() => {
    void loadAvailability()
  }, [loadAvailability])

  React.useEffect(() => {
    const updateMaxSelectableTime = () => {
      setMaxSelectableTime(dayjs())
    }

    window.addEventListener('focus', updateMaxSelectableTime)

    return () => {
      window.removeEventListener('focus', updateMaxSelectableTime)
    }
  }, [])

  const handleDateTimePickerOpen = React.useCallback(() => {
    setMaxSelectableTime(dayjs())
  }, [])

  const loadComparison = React.useCallback(async () => {
    setStartState(null)
    setEndState(null)

    if (
      startTime === undefined ||
      endTime === undefined ||
      !Number.isFinite(startTime.getTime()) ||
      !Number.isFinite(endTime.getTime())
    ) {
      setMessage('Выберите обе точки времени')
      return
    }

    const selectedEndTime = endTimeIsCurrent ? new Date() : endTime

    if (startTime.getTime() > selectedEndTime.getTime()) {
      setMessage('Начальная точка должна быть раньше конечной')
      return
    }

    setMessage('')
    setLoading(true)

    const actualEndStatus = endTimeIsCurrent
      ? await serverConnector
          .findFirstStorageStatus({
            time: new Date(),
            timePoint: TimePointTypeEnum.BEFORE
          })
          .then(
            (value) => ({ status: 'fulfilled' as const, value }),
            (reason: unknown) => ({ status: 'rejected' as const, reason })
          )
      : null

    const effectiveEndTime =
      actualEndStatus?.status === 'fulfilled'
        ? new Date(actualEndStatus.value.time)
        : selectedEndTime

    if (actualEndStatus?.status === 'fulfilled') {
      setAvailableTo(actualEndStatus.value)
    }

    if (
      availableFrom !== null &&
      startTime.getTime() + 60 * 1000 <= new Date(availableFrom.time).getTime()
    ) {
      setMessage('Начальная точка раньше первого снимка мониторинга')
      setLoading(false)
      return
    }

    const [from, to] = await Promise.allSettled([
      serverConnector.findFirstStorageStatus({
        time: startTime,
        timePoint: TimePointTypeEnum.AFTER
      }),
      actualEndStatus?.status === 'fulfilled'
        ? Promise.resolve(actualEndStatus.value)
        : serverConnector.findFirstStorageStatus({
            time: effectiveEndTime,
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
  }, [availableFrom, endTime, endTimeIsCurrent, startTime])

  const metrics = React.useMemo(() => {
    if (startState === null || endState === null) return null
    const memUsedBefore = toBytes(startState.memUsed)
    const memUsedAfter = toBytes(endState.memUsed)
    const memTotalBefore = toBytes(startState.memTotal)
    const memTotalAfter = toBytes(endState.memTotal)
    const memFreeBefore = memTotalBefore - memUsedBefore
    const memFreeAfter = memTotalAfter - memUsedAfter
    const diskFreeBefore = toBytes(startState.diskAvailable)
    const diskFreeAfter = toBytes(endState.diskAvailable)
    const diskTotalBefore = toBytes(startState.diskTotal)
    const diskTotalAfter = toBytes(endState.diskTotal)
    const diskUsedBefore = diskTotalBefore - diskFreeBefore
    const diskUsedAfter = diskTotalAfter - diskFreeAfter
    const requestsBefore = toBytes(startState.requestsCnt)
    const requestsAfter = toBytes(endState.requestsCnt)
    const trafficBefore =
      toBytes(startState.requestsTotalSizeBytes) +
      toBytes(startState.responsesTotalSizeBytes)
    const trafficAfter =
      toBytes(endState.requestsTotalSizeBytes) +
      toBytes(endState.responsesTotalSizeBytes)
    const chartLabelColor = theme.palette.mode === 'dark' ? '#000' : '#fff'
    const blueChartColor =
      theme.palette.mode === 'dark' ? brand[300] : brand[400]

    return [
      [
        {
          title: 'ОП свободно',
          before: `${formatBytes(memFreeBefore)} / ${formatBytes(memTotalBefore)}`,
          after: `${formatBytes(memFreeAfter)} / ${formatBytes(memTotalAfter)}`,
          delta: formatBytes(memFreeAfter - memFreeBefore),
          chart: {
            beforeValue: memFreeBefore,
            afterValue: memFreeAfter,
            positiveIsGood: true,
            beforeColor: getFreeResourceColor(
              memFreeBefore,
              memTotalBefore,
              theme.palette.mode
            ),
            afterColor: getFreeResourceColor(
              memFreeAfter,
              memTotalAfter,
              theme.palette.mode
            ),
            labelColor: chartLabelColor,
            deltaLabelColor: chartLabelColor
          }
        },
        {
          title: 'ОП затрачено',
          before: `${formatBytes(memUsedBefore)} / ${formatBytes(memTotalBefore)}`,
          after: `${formatBytes(memUsedAfter)} / ${formatBytes(memTotalAfter)}`,
          delta: formatBytes(memUsedAfter - memUsedBefore),
          chart: {
            beforeValue: memUsedBefore,
            afterValue: memUsedAfter,
            positiveIsGood: false,
            beforeColor: getUsedResourceColor(
              memUsedBefore,
              memTotalBefore,
              theme.palette.mode
            ),
            afterColor: getUsedResourceColor(
              memUsedAfter,
              memTotalAfter,
              theme.palette.mode
            ),
            labelColor: chartLabelColor,
            deltaLabelColor: chartLabelColor
          }
        }
      ],
      [
        {
          title: 'Диск свободно',
          before: `${formatBytes(diskFreeBefore)} / ${formatBytes(diskTotalBefore)}`,
          after: `${formatBytes(diskFreeAfter)} / ${formatBytes(diskTotalAfter)}`,
          delta: formatBytes(diskFreeAfter - diskFreeBefore),
          chart: {
            beforeValue: diskFreeBefore,
            afterValue: diskFreeAfter,
            positiveIsGood: true,
            beforeColor: getFreeResourceColor(
              diskFreeBefore,
              diskTotalBefore,
              theme.palette.mode
            ),
            afterColor: getFreeResourceColor(
              diskFreeAfter,
              diskTotalAfter,
              theme.palette.mode
            ),
            labelColor: chartLabelColor,
            deltaLabelColor: chartLabelColor
          }
        },
        {
          title: 'Диск затрачено',
          before: `${formatBytes(diskUsedBefore)} / ${formatBytes(diskTotalBefore)}`,
          after: `${formatBytes(diskUsedAfter)} / ${formatBytes(diskTotalAfter)}`,
          delta: formatBytes(diskUsedAfter - diskUsedBefore),
          chart: {
            beforeValue: diskUsedBefore,
            afterValue: diskUsedAfter,
            positiveIsGood: false,
            beforeColor: getUsedResourceColor(
              diskUsedBefore,
              diskTotalBefore,
              theme.palette.mode
            ),
            afterColor: getUsedResourceColor(
              diskUsedAfter,
              diskTotalAfter,
              theme.palette.mode
            ),
            labelColor: chartLabelColor,
            deltaLabelColor: chartLabelColor
          }
        }
      ],
      [
        {
          title: 'Запросы',
          tooltip: 'Количество запросов, зафиксированных системой',
          before: formatNumber(startState.requestsCnt),
          after: formatNumber(endState.requestsCnt),
          delta: formatNumber(requestsAfter - requestsBefore),
          chart: {
            beforeValue: requestsBefore,
            afterValue: requestsAfter,
            beforeColor: blueChartColor,
            afterColor: blueChartColor,
            labelColor: chartLabelColor,
            deltaLabelColor: chartLabelColor
          }
        },
        {
          title: 'Трафик',
          tooltip:
            'Суммарный объём трафика входящих запросов и исходящих ответов',
          before: formatBytes(trafficBefore),
          after: formatBytes(trafficAfter),
          delta: formatBytes(trafficAfter - trafficBefore),
          chart: {
            beforeValue: trafficBefore,
            afterValue: trafficAfter,
            beforeColor: blueChartColor,
            afterColor: blueChartColor,
            labelColor: chartLabelColor,
            deltaLabelColor: chartLabelColor
          }
        }
      ]
    ]
  }, [endState, startState, theme.palette.mode])

  const handleMonitoringDateChange = React.useCallback(
    (event: { name: string; value: Date | undefined }) => {
      if (event.name === 'startTime') {
        setStartTime(event.value)
        saveMonitoringTime(MONITORING_START_TIME_LOCAL_STORAGE_KEY, event.value)
      } else if (event.name === 'endTime') {
        setEndTime(event.value)
        setEndTimeIsCurrent(false)
        saveMonitoringTime(MONITORING_END_TIME_LOCAL_STORAGE_KEY, event.value)
      }
    },
    []
  )

  const handleSetCurrentEndTime = React.useCallback(() => {
    const currentTime = new Date()

    setMaxSelectableTime(dayjs(currentTime))
    setEndTime(currentTime)
    setEndTimeIsCurrent(true)
    saveMonitoringTime(MONITORING_END_TIME_LOCAL_STORAGE_KEY, currentTime)
  }, [])

  const minAvailableTime =
    availableFrom === null ? undefined : dayjs(availableFrom.time)

  return (
    <LayoutScreenContainer
      title="мониторинг системы"
      breadcrumbsItems={breadcrumbsItems}
    >
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent sx={{ pt: 2.75, pb: 1, '&:last-child': { pb: 1 } }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '260px 260px max-content'
                },
                columnGap: 1.5,
                rowGap: 0.25,
                alignItems: 'start'
              }}
            >
              <FormDateTime
                label="начальная точка"
                name="startTime"
                value={startTime ?? null}
                onChange={handleMonitoringDateChange}
                placeholder="дд.мм.гггг чч:мм:сс"
                minDateTime={minAvailableTime}
                maxDateTime={maxSelectableTime}
                formControlSx={{ m: 0, minWidth: 260, alignSelf: 'flex-start' }}
                sx={monitoringDateTimeFieldSx}
                popperSx={monitoringDatePickerPopperSx}
                desktopPaperSx={monitoringDatePickerPaperSx}
                onOpen={handleDateTimePickerOpen}
              />
              <FormDateTime
                label="конечная точка"
                name="endTime"
                value={endTime ?? null}
                onChange={handleMonitoringDateChange}
                placeholder="дд.мм.гггг чч:мм:сс"
                minDateTime={minAvailableTime}
                maxDateTime={maxSelectableTime}
                formControlSx={{ m: 0, minWidth: 260, alignSelf: 'flex-start' }}
                sx={monitoringDateTimeFieldSx}
                popperSx={monitoringDatePickerPopperSx}
                desktopPaperSx={monitoringDatePickerPaperSx}
                onOpen={handleDateTimePickerOpen}
              />
              <Button
                variant="contained"
                size="small"
                sx={{
                  height: 24,
                  minWidth: 104,
                  px: 1.5,
                  fontSize: '0.65rem',
                  alignSelf: 'flex-start'
                }}
                disabled={loading}
                onClick={() => void loadComparison()}
              >
                Сравнить
              </Button>
              {availableFrom !== null && availableTo !== null ? (
                <Typography
                  color="text.secondary"
                  sx={{
                    gridColumn: 1,
                    fontSize: '0.65rem',
                    lineHeight: 1.2
                  }}
                >
                  Данные доступны с {formatTime(availableFrom.time)}
                </Typography>
              ) : null}
              <Button
                variant="contained"
                size="small"
                sx={{
                  gridColumn: { xs: 1, md: 2 },
                  justifySelf: 'start',
                  minWidth: 0,
                  height: 14,
                  px: 0.75,
                  py: 0,
                  fontSize: '0.55rem',
                  lineHeight: 1
                }}
                onClick={handleSetCurrentEndTime}
              >
                Текущее время
              </Button>
            </Box>
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
            {metrics.map((column, index) => (
              <Stack
                key={index}
                spacing={2}
                sx={{
                  width: { xs: '100%', md: 'calc((100% - 32px) / 3)' }
                }}
              >
                {column.map((metric) => (
                  <MetricCard key={metric.title} {...metric} />
                ))}
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </LayoutScreenContainer>
  )
}
