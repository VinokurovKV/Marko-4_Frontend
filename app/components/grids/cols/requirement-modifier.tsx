// Project
import {
  type RequirementModifier,
  allRequirementModifiers
} from '@common/enums'
import { localizationForRequirementModifier } from '~/localization'
// React
import * as React from 'react'
// Material UI
import LockOpenIcon from '@mui/icons-material/LockOpenTwoTone'
import LockIcon from '@mui/icons-material/LockTwoTone'
import PanToolAltIcon from '@mui/icons-material/PanToolAltTwoTone'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(modifier: RequirementModifier) {
  return capitalize(
    localizationForRequirementModifier.get(modifier) ?? modifier ?? ''
  )
}

interface RequirementModifierIconProps {
  value?: string
}

function RequirementModifierIcon({ value }: RequirementModifierIconProps) {
  return (
    <Tooltip title={value}>
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ height: '100%' }}
      >
        {value === getValue('MUST') ? (
          <LockIcon color="error" sx={{ opacity: 0.8 }} />
        ) : value === getValue('SHOULD') ? (
          <PanToolAltIcon color="warning" sx={{ opacity: 0.8 }} />
        ) : value === getValue('MAY') ? (
          <LockOpenIcon color="success" sx={{ opacity: 0.8 }} />
        ) : null}
      </Stack>
    </Tooltip>
  )
}

export function useRequirementModifierCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'modifier',
      headerName: 'Модификатор',
      type: 'singleSelect',
      valueOptions: allRequirementModifiers.map(getValue),
      valueGetter: getValue,
      renderCell: (params: GridRenderCellParams<any, RequirementModifier>) => (
        <RequirementModifierIcon value={params.value} />
      ),
      headerAlign: 'center',
      align: 'center',
      minWidth: 120,
      flex: 0.01
    }),
    []
  )

  return col
}
