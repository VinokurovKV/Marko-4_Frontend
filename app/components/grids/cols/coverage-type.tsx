// Project
import { type CoverageType, allCoverageTypes } from '@common/enums'
import { localizationForCoverageType } from '~/localization'
// React
import * as React from 'react'
// Material UI
import LockOpenIcon from '@mui/icons-material/LockOpen'
import LockIcon from '@mui/icons-material/Lock'
import PanToolAltIcon from '@mui/icons-material/PanToolAlt'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(type: CoverageType) {
  return capitalize(localizationForCoverageType.get(type) ?? type ?? '')
}

interface CoverageTypeIconProps {
  value?: string
}

function CoverageTypeIcon({ value }: CoverageTypeIconProps) {
  const full = value === getValue('FULL')
  const mustAndShould = value === getValue('MUST_AND_SHOULD')
  const onlyMust = value === getValue('ONLY_MUST')
  return (
    <Tooltip title={value}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        sx={{ height: '100%' }}
      >
        <>
          <LockIcon
            color="error"
            sx={{ opacity: full || mustAndShould || onlyMust ? 0.8 : 0 }}
          />
          <PanToolAltIcon
            color="warning"
            sx={{ opacity: full || mustAndShould ? 0.8 : 0 }}
          />
          <LockOpenIcon color="success" sx={{ opacity: full ? 0.8 : 0 }} />
        </>
      </Stack>
    </Tooltip>
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
        <CoverageTypeIcon value={params.value} />
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
