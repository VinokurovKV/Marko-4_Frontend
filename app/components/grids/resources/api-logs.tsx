// Project
import { LogTypeEnum } from '@common/enums'
import { DownloadLogsForm } from '~/components/forms/resources/download-logs'
import type { ApiSystemLog } from '~/types'
import { useDateTimeCol } from '../cols/date'
import { Grid } from '../grid'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

export interface ApiLogsGridProps {
  logs: ApiSystemLog[]
  title?: string
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

export function ApiLogsGrid(props: ApiLogsGridProps) {
  const [downloadDialogOpen, setDownloadDialogOpen] = React.useState(false)
  const rows: GridValidRowModel[] = React.useMemo(
    () =>
      props.logs.map((log, index) => ({
        ...log,
        id: log.id ?? index,
        displayId: log.id,
        displayMethod:
          (log as ApiSystemLog & { method?: string }).methodType ??
          (log as ApiSystemLog & { method?: string }).method
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
        field: 'displayMethod',
        headerName: 'Метод',
        minWidth: 150,
        flex: 0.15
      },
      {
        field: 'success',
        headerName: 'Успех',
        minWidth: 90,
        flex: 0.01,
        valueFormatter: formatBoolean
      },
      {
        field: 'userId',
        headerName: 'ID пользователя',
        minWidth: 140,
        flex: 0.08
      },
      {
        field: 'userLoginAtTheMoment',
        headerName: 'Пользователь',
        minWidth: 160,
        flex: 0.12
      },
      {
        field: 'ip',
        headerName: 'IP',
        minWidth: 130,
        flex: 0.08
      },
      {
        field: 'statusCode',
        headerName: 'Статус',
        minWidth: 95,
        flex: 0.01
      },
      {
        field: 'path',
        headerName: 'Путь',
        minWidth: 260,
        flex: 0.3
      },
      {
        field: 'durationMs',
        headerName: 'Длительность',
        minWidth: 130,
        flex: 0.08
      }
    ],
    [timeCol]
  )
  const defaultHiddenFields = React.useMemo(
    () => ['displayId', 'userId', 'ip', 'durationMs'],
    []
  )

  return (
    <>
      <Grid
        localSaveKey="API_SYSTEM_LOGS"
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
        logType={LogTypeEnum.API}
        onClose={() => setDownloadDialogOpen(false)}
      />
    </>
  )
}
