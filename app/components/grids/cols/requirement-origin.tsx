// Project
import { allRequirementOrigins } from '@common/enums'
import { localizationForRequirementOrigin } from '~/localization'
// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(type: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return capitalize(localizationForRequirementOrigin.get(type) ?? type ?? '')
}

export function useRequirementOriginCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'origin',
      headerName: 'Происхождение',
      type: 'singleSelect',
      valueOptions: allRequirementOrigins.map(getValue),
      valueGetter: getValue,
      minWidth: 150,
      flex: 0.01
    }),
    []
  )

  return col
}
