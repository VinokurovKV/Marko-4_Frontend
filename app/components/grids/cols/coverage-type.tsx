// Project
import { type CoverageType, allCoverageTypes } from '@common/enums'
import { localizationForCoverageType } from '~/localization'
import { CoverageTypeIcon } from '~/components/icons/coverage-type'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(type: CoverageType) {
  return capitalize(localizationForCoverageType.get(type) ?? type ?? '')
}

interface IconProps {
  value?: string
}

function Icon({ value }: IconProps) {
  return (
    <CoverageTypeIcon
      type={
        value === getValue('FULL')
          ? 'FULL'
          : value === getValue('MUST_AND_SHOULD')
            ? 'MUST_AND_SHOULD'
            : 'ONLY_MUST'
      }
    />
  )
}

export function useCoverageTypeCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'type',
      headerName: 'Тип',
      type: 'singleSelect',
      valueOptions: allCoverageTypes.map(getValue),
      valueGetter: getValue,
      renderCell: (params: GridRenderCellParams<any, CoverageType>) => (
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
