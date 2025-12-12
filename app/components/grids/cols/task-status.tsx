// Project
import { type TaskStatus, allTaskStatuses } from '@common/enums'
import { localizationForTaskStatus } from '~/localization'
import { TaskStatusIcon } from '~/components/icons'
// React
import * as React from 'react'
// Material UI
import Stack from '@mui/material/Stack'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(status: TaskStatus) {
  return capitalize(localizationForTaskStatus.get(status) ?? status ?? '')
}

interface IconProps {
  value?: string
}

function Icon({ value }: IconProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      sx={{ height: '100%' }}
    >
      {value === getValue('CREATED') ? (
        <TaskStatusIcon status="CREATED" />
      ) : value === getValue('CREATED_PAUSED') ? (
        <TaskStatusIcon status="CREATED_PAUSED" />
      ) : value === getValue('CANCELED') ? (
        <TaskStatusIcon status="CANCELED" />
      ) : value === getValue('LAUNCHED') ? (
        <TaskStatusIcon status="LAUNCHED" />
      ) : value === getValue('LAUNCHED_PAUSED') ? (
        <TaskStatusIcon status="LAUNCHED_PAUSED" />
      ) : value === getValue('ABORTED_BY_USER') ? (
        <TaskStatusIcon status="ABORTED_BY_USER" />
      ) : value === getValue('ABORTED_DUE_TO_NOT_PASSED') ? (
        <TaskStatusIcon status="ABORTED_DUE_TO_NOT_PASSED" />
      ) : value === getValue('COMPLETED') ? (
        <TaskStatusIcon status="COMPLETED" />
      ) : null}
    </Stack>
  )
}

export function useTaskStatusCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'status',
      headerName: 'Статус',
      type: 'singleSelect',
      valueOptions: allTaskStatuses.map(getValue),
      valueGetter: getValue,
      renderCell: (params: GridRenderCellParams<any, TaskStatus>) => (
        <Icon value={params.value} />
      ),
      headerAlign: 'center',
      align: 'center',
      minWidth: 80,
      flex: 0.01
    }),
    []
  )

  return col
}
