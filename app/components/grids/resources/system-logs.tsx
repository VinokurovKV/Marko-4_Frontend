// Project
import type {
  ReadApiLogsQueryDto,
  ReadStorageLogsQueryDto
} from '@common/dtos/server-api/logs.dto'
import { LogTypeEnum, MethodTypeEnum, ReturnTypeEnum } from '@common/enums'
import type { SystemLog } from '~/types'
import { useNotifier } from '~/providers/notifier'
import { serverConnector } from '~/server-connector'
import { downloadFileFromBlob } from '~/utilities'
import { Grid } from '../grid'
import { useDateTimeCol } from '../cols/date'
// React
import * as React from 'react'
// Material UI
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

export interface SystemLogsGridProps {
  logs: SystemLog[]
  title?: string
}

type DownloadLogsFormData = {
  logType: LogTypeEnum
  returnType: ReturnTypeEnum.CSV | ReturnTypeEnum.LOG
  ids: string
  minCreateTime: string
  maxCreateTime: string
  getMethod: boolean
  postMethod: boolean
  successLogs: boolean
  failedLogs: boolean
  userIds: string
  userLogins: string
  ips: string
  statusCodes: string
  paths: string
  minDurationMs: string
  maxDurationMs: string
  internalStorageErrorLogs: boolean
  externalStorageErrorLogs: boolean
  methodNames: string
  errorReasonsTypes: string
}

const INITIAL_DOWNLOAD_LOGS_FORM_DATA: DownloadLogsFormData = {
  logType: LogTypeEnum.API,
  returnType: ReturnTypeEnum.CSV,
  ids: '',
  minCreateTime: '',
  maxCreateTime: '',
  getMethod: true,
  postMethod: true,
  successLogs: true,
  failedLogs: true,
  userIds: '',
  userLogins: '',
  ips: '',
  statusCodes: '',
  paths: '',
  minDurationMs: '',
  maxDurationMs: '',
  internalStorageErrorLogs: true,
  externalStorageErrorLogs: true,
  methodNames: '',
  errorReasonsTypes: ''
}

function formatLogType(value: unknown) {
  return value === 'API' ? 'API' : 'Хранилище'
}

function trimTrailingAsterisk(value: string | undefined) {
  return value?.replace(/\*+$/u, '')
}

function formatBoolean(value: unknown) {
  if (value === true) {
    return 'да'
  }
  if (value === false) {
    return 'нет'
  }
  return ''
}

function parseStringList(value: string) {
  const result = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
  return result.length > 0 ? result : undefined
}

function parseNumberList(value: string) {
  const result = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item))
  return result.length > 0 ? result : undefined
}

function parseNumber(value: string) {
  if (value.trim() === '') return undefined
  const result = Number(value.trim())
  return Number.isFinite(result) ? result : undefined
}

function parseDate(value: string) {
  return value === '' ? undefined : new Date(value)
}

function getSelectedBooleans(trueSelected: boolean, falseSelected: boolean) {
  if (trueSelected && falseSelected) return undefined
  if (trueSelected) return [true]
  if (falseSelected) return [false]
  return []
}

function getSelectedMethodTypes(data: DownloadLogsFormData) {
  if (data.getMethod && data.postMethod) return undefined
  if (data.getMethod) return [MethodTypeEnum.GET]
  if (data.postMethod) return [MethodTypeEnum.POST]
  return []
}

function getDownloadStamp() {
  return new Date().toISOString().replace(/[:.]/gu, '-')
}

export function SystemLogsGrid(props: SystemLogsGridProps) {
  const notifier = useNotifier()
  const [downloadDialogOpen, setDownloadDialogOpen] = React.useState(false)
  const [downloadLogsFormData, setDownloadLogsFormData] = React.useState(
    INITIAL_DOWNLOAD_LOGS_FORM_DATA
  )
  const [downloadSubmitting, setDownloadSubmitting] = React.useState(false)

  const setDownloadLogsFormField = React.useCallback(
    <TField extends keyof DownloadLogsFormData>(
      field: TField,
      value: DownloadLogsFormData[TField]
    ) => {
      setDownloadLogsFormData((data) => ({ ...data, [field]: value }))
    },
    []
  )

  const handleDownloadLogsSubmit = React.useCallback(async () => {
    setDownloadSubmitting(true)
    try {
      const ids = parseNumberList(downloadLogsFormData.ids)
      const methodTypes = getSelectedMethodTypes(downloadLogsFormData)
      const LogSuccesses = getSelectedBooleans(
        downloadLogsFormData.successLogs,
        downloadLogsFormData.failedLogs
      )
      const minCreateTime = parseDate(downloadLogsFormData.minCreateTime)
      const maxCreateTime = parseDate(downloadLogsFormData.maxCreateTime)
      const extension = downloadLogsFormData.returnType.toLowerCase()
      const stamp = getDownloadStamp()
      const commonParams = {
        returnType: downloadLogsFormData.returnType,
        ...(ids !== undefined ? { ids } : {}),
        ...(minCreateTime !== undefined ? { minCreateTime } : {}),
        ...(maxCreateTime !== undefined ? { maxCreateTime } : {}),
        ...(methodTypes !== undefined ? { methodTypes } : {}),
        ...(LogSuccesses !== undefined ? { LogSuccesses } : {})
      }

      if (downloadLogsFormData.logType === LogTypeEnum.API) {
        const userIds = parseNumberList(downloadLogsFormData.userIds)
        const userLogins = parseStringList(downloadLogsFormData.userLogins)
        const ips = parseStringList(downloadLogsFormData.ips)
        const statusCodes = parseNumberList(downloadLogsFormData.statusCodes)
        const paths = parseStringList(downloadLogsFormData.paths)
        const minDurationMs = parseNumber(downloadLogsFormData.minDurationMs)
        const maxDurationMs = parseNumber(downloadLogsFormData.maxDurationMs)
        const params: ReadApiLogsQueryDto = {
          ...commonParams,
          idSelect: true,
          timeSelect: true,
          methodTypeSelect: true,
          successSelect: true,
          userIdSelect: true,
          userLoginAtTheMomentSelect: true,
          ipSelect: true,
          statusCodeSelect: true,
          pathSelect: true,
          durationMsSelect: true,
          ...(userIds !== undefined ? { userIds } : {}),
          ...(userLogins !== undefined ? { userLogins } : {}),
          ...(ips !== undefined ? { ips } : {}),
          ...(statusCodes !== undefined ? { statusCodes } : {}),
          ...(paths !== undefined ? { paths } : {}),
          ...(minDurationMs !== undefined ? { minDurationMs } : {}),
          ...(maxDurationMs !== undefined ? { maxDurationMs } : {})
        }
        const blob = await serverConnector.readApiLogsFile(params)
        downloadFileFromBlob(blob, `api-logs-${stamp}.${extension}`)
      } else {
        const internalStorageErrors = getSelectedBooleans(
          downloadLogsFormData.internalStorageErrorLogs,
          downloadLogsFormData.externalStorageErrorLogs
        )
        const methodNames = parseStringList(downloadLogsFormData.methodNames)
        const errorReasonsTypes = parseStringList(
          downloadLogsFormData.errorReasonsTypes
        )
        const params: ReadStorageLogsQueryDto = {
          ...commonParams,
          idSelect: true,
          timeSelect: true,
          methodTypeSelect: true,
          successSelect: true,
          internalStorageErrorSelect: true,
          methodNameSelect: true,
          requestSelect: true,
          errorReasonsTypesSelect: true,
          errorReasonsFullSelect: true,
          ...(internalStorageErrors !== undefined
            ? { internalStorageErrors }
            : {}),
          ...(methodNames !== undefined ? { methodNames } : {}),
          ...(errorReasonsTypes !== undefined ? { errorReasonsTypes } : {})
        }
        const blob = await serverConnector.readStorageLogsFile(params)
        downloadFileFromBlob(blob, `storage-logs-${stamp}.${extension}`)
      }

      setDownloadDialogOpen(false)
      notifier.showSuccess('Логи скачаны')
    } catch (error) {
      notifier.showError(error, 'не удалось скачать системные логи')
    } finally {
      setDownloadSubmitting(false)
    }
  }, [downloadLogsFormData, notifier])
  const rows: GridValidRowModel[] = props.logs.map((log, index) => ({
    ...log,
    id: `${log.logType}-${log.id ?? index}`,
    displayId: log.id,
    displayMethod:
      log.logType === 'API'
        ? log.methodType
        : trimTrailingAsterisk(log.methodName),
    displayErrorReasons:
      log.logType === 'STORAGE'
        ? trimTrailingAsterisk(log.errorReasonsTypes?.join(', '))
        : ''
  }))
  const timeCol = useDateTimeCol({
    field: 'time',
    headerName: 'Время',
    minWidth: 190,
    flex: 0.18
  })

  const cols: GridColDef[] = React.useMemo(
    () => [
      {
        field: 'logType',
        headerName: 'Тип',
        minWidth: 120,
        flex: 0.12,
        valueFormatter: formatLogType
      },
      {
        field: 'displayId',
        headerName: 'ID',
        type: 'number',
        minWidth: 70,
        flex: 0.06
      },
      timeCol,
      {
        field: 'displayMethod',
        headerName: 'Метод',
        minWidth: 190,
        flex: 0.22
      },
      {
        field: 'success',
        headerName: 'Успех',
        minWidth: 90,
        flex: 0.08,
        valueFormatter: formatBoolean
      },
      {
        field: 'userLoginAtTheMoment',
        headerName: 'Пользователь',
        minWidth: 150,
        flex: 0.16
      },
      {
        field: 'ip',
        headerName: 'IP',
        minWidth: 130,
        flex: 0.14
      },
      {
        field: 'statusCode',
        headerName: 'Статус',
        minWidth: 95,
        flex: 0.08
      },
      {
        field: 'path',
        headerName: 'Путь',
        minWidth: 260,
        flex: 0.32
      },
      {
        field: 'duration',
        headerName: 'Длительность',
        minWidth: 130,
        flex: 0.12
      },
      {
        field: 'internalStorageError',
        headerName: 'Внутр. ошибка',
        minWidth: 130,
        flex: 0.12,
        valueFormatter: formatBoolean
      },
      {
        field: 'displayErrorReasons',
        headerName: 'Причины ошибок',
        minWidth: 220,
        flex: 0.28
      }
    ],
    [timeCol]
  )

  const defaultHiddenFields = React.useMemo(
    () =>
      [
        'displayId',
        'duration',
        'internalStorageError',
        'displayErrorReasons'
      ] as string[],
    []
  )

  return (
    <>
      <Grid
        localSaveKey="SYSTEM_LOGS_SCREEN_DEFAULT_COLUMNS"
        title={props.title}
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={false}
        exportButton={{
          onClick: () => {
            setDownloadLogsFormData(INITIAL_DOWNLOAD_LOGS_FORM_DATA)
            setDownloadDialogOpen(true)
          }
        }}
      />

      <Dialog
        open={downloadDialogOpen}
        onClose={() => setDownloadDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Скачать системные логи</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="тип логов"
                size="small"
                fullWidth
                value={downloadLogsFormData.logType}
                onChange={(event) =>
                  setDownloadLogsFormField(
                    'logType',
                    event.target.value as LogTypeEnum
                  )
                }
              >
                <MenuItem value={LogTypeEnum.API}>API</MenuItem>
                <MenuItem value={LogTypeEnum.STORAGE}>Хранилище</MenuItem>
              </TextField>
              <Stack direction="row" spacing={1} sx={{ minWidth: 180 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        downloadLogsFormData.returnType === ReturnTypeEnum.CSV
                      }
                      onChange={() =>
                        setDownloadLogsFormField(
                          'returnType',
                          ReturnTypeEnum.CSV
                        )
                      }
                    />
                  }
                  label="CSV"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        downloadLogsFormData.returnType === ReturnTypeEnum.LOG
                      }
                      onChange={() =>
                        setDownloadLogsFormField(
                          'returnType',
                          ReturnTypeEnum.LOG
                        )
                      }
                    />
                  }
                  label="LOG"
                />
              </Stack>
            </Stack>

            <Typography variant="subtitle1">Общие фильтры</Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                label="ID через запятую"
                size="small"
                fullWidth
                value={downloadLogsFormData.ids}
                onChange={(event) =>
                  setDownloadLogsFormField('ids', event.target.value)
                }
              />
              <TextField
                label="с даты"
                type="datetime-local"
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={downloadLogsFormData.minCreateTime}
                onChange={(event) =>
                  setDownloadLogsFormField('minCreateTime', event.target.value)
                }
              />
              <TextField
                label="по дату"
                type="datetime-local"
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={downloadLogsFormData.maxCreateTime}
                onChange={(event) =>
                  setDownloadLogsFormField('maxCreateTime', event.target.value)
                }
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={downloadLogsFormData.getMethod}
                    onChange={(event) =>
                      setDownloadLogsFormField(
                        'getMethod',
                        event.target.checked
                      )
                    }
                  />
                }
                label="GET"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={downloadLogsFormData.postMethod}
                    onChange={(event) =>
                      setDownloadLogsFormField(
                        'postMethod',
                        event.target.checked
                      )
                    }
                  />
                }
                label="POST"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={downloadLogsFormData.successLogs}
                    onChange={(event) =>
                      setDownloadLogsFormField(
                        'successLogs',
                        event.target.checked
                      )
                    }
                  />
                }
                label="успешные"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={downloadLogsFormData.failedLogs}
                    onChange={(event) =>
                      setDownloadLogsFormField(
                        'failedLogs',
                        event.target.checked
                      )
                    }
                  />
                }
                label="с ошибкой"
              />
            </Stack>

            {downloadLogsFormData.logType === LogTypeEnum.API ? (
              <>
                <Typography variant="subtitle1">Фильтры API</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="ID пользователей"
                    size="small"
                    fullWidth
                    value={downloadLogsFormData.userIds}
                    onChange={(event) =>
                      setDownloadLogsFormField('userIds', event.target.value)
                    }
                  />
                  <TextField
                    label="логины"
                    size="small"
                    fullWidth
                    value={downloadLogsFormData.userLogins}
                    onChange={(event) =>
                      setDownloadLogsFormField('userLogins', event.target.value)
                    }
                  />
                  <TextField
                    label="IP"
                    size="small"
                    fullWidth
                    value={downloadLogsFormData.ips}
                    onChange={(event) =>
                      setDownloadLogsFormField('ips', event.target.value)
                    }
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="статусы"
                    size="small"
                    fullWidth
                    value={downloadLogsFormData.statusCodes}
                    onChange={(event) =>
                      setDownloadLogsFormField(
                        'statusCodes',
                        event.target.value
                      )
                    }
                  />
                  <TextField
                    label="пути"
                    size="small"
                    fullWidth
                    value={downloadLogsFormData.paths}
                    onChange={(event) =>
                      setDownloadLogsFormField('paths', event.target.value)
                    }
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="мин. длительность, мс"
                    size="small"
                    fullWidth
                    value={downloadLogsFormData.minDurationMs}
                    onChange={(event) =>
                      setDownloadLogsFormField(
                        'minDurationMs',
                        event.target.value
                      )
                    }
                  />
                  <TextField
                    label="макс. длительность, мс"
                    size="small"
                    fullWidth
                    value={downloadLogsFormData.maxDurationMs}
                    onChange={(event) =>
                      setDownloadLogsFormField(
                        'maxDurationMs',
                        event.target.value
                      )
                    }
                  />
                </Stack>
              </>
            ) : (
              <>
                <Typography variant="subtitle1">Фильтры хранилища</Typography>
                <Stack direction="row" spacing={2}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={downloadLogsFormData.internalStorageErrorLogs}
                        onChange={(event) =>
                          setDownloadLogsFormField(
                            'internalStorageErrorLogs',
                            event.target.checked
                          )
                        }
                      />
                    }
                    label="внутренняя ошибка"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={downloadLogsFormData.externalStorageErrorLogs}
                        onChange={(event) =>
                          setDownloadLogsFormField(
                            'externalStorageErrorLogs',
                            event.target.checked
                          )
                        }
                      />
                    }
                    label="без внутренней ошибки"
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="методы"
                    size="small"
                    fullWidth
                    value={downloadLogsFormData.methodNames}
                    onChange={(event) =>
                      setDownloadLogsFormField(
                        'methodNames',
                        event.target.value
                      )
                    }
                  />
                  <TextField
                    label="причины ошибок"
                    size="small"
                    fullWidth
                    value={downloadLogsFormData.errorReasonsTypes}
                    onChange={(event) =>
                      setDownloadLogsFormField(
                        'errorReasonsTypes',
                        event.target.value
                      )
                    }
                  />
                </Stack>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDownloadDialogOpen(false)}>Отменить</Button>
          <Button
            variant="contained"
            disabled={downloadSubmitting}
            onClick={() => void handleDownloadLogsSubmit()}
          >
            Скачать
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
