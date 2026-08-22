// Project
import { LogTypeEnum } from '@common/enums'
import { DownloadLogsForm } from '~/components/forms/resources/download-logs'
import type { StorageSystemLog } from '~/types'
import { useDateTimeCol } from '../cols/date'
import { Grid } from '../grid'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

export interface StorageLogsGridProps {
  logs: StorageSystemLog[]
  title?: string
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

export function StorageLogsGrid(props: StorageLogsGridProps) {
  const [downloadDialogOpen, setDownloadDialogOpen] = React.useState(false)
  const rows: GridValidRowModel[] = React.useMemo(
    () =>
      props.logs.map((log, index) => ({
        ...log,
        id: log.id ?? index,
        displayId: log.id,
        displayMethod: trimTrailingAsterisk(log.methodName),
        displayErrorReasons: trimTrailingAsterisk(
          log.errorReasonsTypes?.join(', ')
        )
      })),
    [props.logs]
  )
  const timeCol = useDateTimeCol({
    field: 'time',
    headerName: 'Время',
    minWidth: 200,
    flex: 0.01
  })
  const cols: GridColDef[] = React.useMemo(
    () => [
      {
        field: 'displayId',
        headerName: 'ID',
        type: 'number',
        minWidth: 70,
        flex: 0.01
      },
      timeCol,
      {
        field: 'success',
        headerName: 'Успех',
        minWidth: 90,
        flex: 0.01,
        valueFormatter: formatBoolean
      },
      {
        field: 'internalStorageError',
        headerName: 'Внутр. ошибка',
        minWidth: 130,
        flex: 0.08,
        valueFormatter: formatBoolean
      },
      {
        field: 'displayMethod',
        headerName: 'Метод',
        minWidth: 150,
        flex: 0.15
      },
      {
        field: 'request',
        headerName: 'Запрос',
        minWidth: 260,
        flex: 0.3
      },
      {
        field: 'displayErrorReasons',
        headerName: 'Причины ошибок',
        minWidth: 220,
        flex: 0.18
      },
      {
        field: 'errorReasonsFull',
        headerName: 'Подробности ошибок',
        minWidth: 260,
        flex: 0.3
      }
    ],
    [timeCol]
  )
  const defaultHiddenFields = React.useMemo(
    () => [
      'displayId',
      'internalStorageError',
      'request',
      'displayErrorReasons',
      'errorReasonsFull'
    ],
    []
  )

  return (
    <>
      <Grid
        localSaveKey="STORAGE_SYSTEM_LOGS"
        title={props.title}
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={false}
        exportButton={{
          onClick: () => setDownloadDialogOpen(true)
        }}
      />
      <DownloadLogsForm
        open={downloadDialogOpen}
        logType={LogTypeEnum.STORAGE}
        onClose={() => setDownloadDialogOpen(false)}
      />
    </>
  )
}
