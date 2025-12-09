// Project
import { type TaskMode, allTaskModes } from '@common/enums'
import { localizationForTaskMode } from '~/localization'
import { TaskModeIcon } from '~/components/icons'
// React
import * as React from 'react'
// Material UI
import Stack from '@mui/material/Stack'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(mode: TaskMode) {
  return capitalize(localizationForTaskMode.get(mode) ?? mode ?? '')
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
      spacing={-0.5}
      sx={{ height: '100%' }}
    >
      {value === getValue('TEST') ? (
        <TaskModeIcon mode="TEST" />
      ) : value === getValue('GENERATE_PASS_CRITERIA_WITHOUT_UPDATE') ? (
        <TaskModeIcon mode="GENERATE_PASS_CRITERIA_WITHOUT_UPDATE" />
      ) : value === getValue('GENERATE_PASS_CRITERIA_WITH_UPDATE') ? (
        <TaskModeIcon mode="GENERATE_PASS_CRITERIA_WITH_UPDATE" />
      ) : null}
    </Stack>
  )
}

export function useTaskModeCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'mode',
      headerName: 'Режим',
      type: 'singleSelect',
      valueOptions: allTaskModes.map(getValue),
      valueGetter: getValue,
      renderCell: (params: GridRenderCellParams<any, TaskMode>) => (
        <Icon value={params.value} />
      ),
      headerAlign: 'center',
      align: 'center',
      minWidth: 100,
      flex: 0.01
    }),
    []
  )

  return col
}
