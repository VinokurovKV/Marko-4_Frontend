// Project
import {
  type RequirementModifier,
  allRequirementModifiers
} from '@common/enums'
import { localizationForRequirementModifier } from '~/localization'
import { RequirementModifierIcon } from '~/components/icons'
// React
import * as React from 'react'
// Material UI
import Stack from '@mui/material/Stack'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(modifier: RequirementModifier) {
  return capitalize(
    localizationForRequirementModifier.get(modifier) ?? modifier ?? ''
  )
}

interface IconProps {
  value?: string
}

function Icon({ value }: IconProps) {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
      {value === getValue('MUST') ? (
        <RequirementModifierIcon modifier="MUST" />
      ) : value === getValue('SHOULD') ? (
        <RequirementModifierIcon modifier="SHOULD" />
      ) : value === getValue('MAY') ? (
        <RequirementModifierIcon modifier="MAY" />
      ) : null}
    </Stack>
  )
}

export function useRequirementModifierCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'modifier',
      headerName: 'Модиф.',
      type: 'singleSelect',
      valueOptions: allRequirementModifiers.map(getValue),
      valueGetter: getValue,
      renderCell: (params: GridRenderCellParams<any, RequirementModifier>) => (
        <Icon value={params.value} />
      ),
      headerAlign: 'center',
      align: 'center',
      minWidth: 70,
      flex: 0.01
    }),
    []
  )

  return col
}
