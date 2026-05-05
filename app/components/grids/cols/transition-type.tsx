// Project
import { allTransitionTypes } from '@common/enums'
import { localizationForTransitionType } from '~/localization'
// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(type: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return capitalize(localizationForTransitionType.get(type) ?? type ?? '')
}

export function useTransitionTypeCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'transitionType',
      headerName: 'Тип',
      type: 'singleSelect',
      valueOptions: allTransitionTypes.map(getValue),
      valueGetter: getValue,
      minWidth: 140,
      flex: 1
    }),
    []
  )

  return col
}
