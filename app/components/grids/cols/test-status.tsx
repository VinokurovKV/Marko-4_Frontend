// Project
import { type TestStatus, allTestStatuses } from '@common/enums'
import { localizationForTestStatus } from '~/localization'
import { TestStatusIcon } from '~/components/icons'
// React
import * as React from 'react'
// Material UI
import Stack from '@mui/material/Stack'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(status: TestStatus) {
  return capitalize(localizationForTestStatus.get(status) ?? status ?? '')
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
      {value === getValue('WAITING') ? (
        <TestStatusIcon status="WAITING" />
      ) : value === getValue('CANCELED') ? (
        <TestStatusIcon status="CANCELED" />
      ) : value === getValue('LAUNCHED') ? (
        <TestStatusIcon status="LAUNCHED" />
      ) : value === getValue('ABORTED') ? (
        <TestStatusIcon status="ABORTED" />
      ) : value === getValue('ERROR') ? (
        <TestStatusIcon status="ERROR" />
      ) : value === getValue('FAILED') ? (
        <TestStatusIcon status="FAILED" />
      ) : value === getValue('PASSED') ? (
        <TestStatusIcon status="PASSED" />
      ) : null}
    </Stack>
  )
}

export function useTestStatusCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'status',
      headerName: 'Статус',
      type: 'singleSelect',
      valueOptions: allTestStatuses.map(getValue),
      valueGetter: getValue,
      renderCell: (params: GridRenderCellParams<any, TestStatus>) => (
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
