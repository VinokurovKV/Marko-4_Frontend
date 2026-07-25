// Project
import type { SystemLog } from '~/types'
import { Grid } from '../grid'
import { useDateTimeCol } from '../cols/date'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

export interface SystemLogsGridProps {
  logs: SystemLog[]
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

export function SystemLogsGrid(props: SystemLogsGridProps) {
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

  return (
    <Grid
      localSaveKey="SYSTEM_LOGS"
      title="системные логи"
      cols={cols}
      rows={rows}
      navigationMode={false}
    />
  )
}
