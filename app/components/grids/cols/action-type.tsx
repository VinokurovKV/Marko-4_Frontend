// Project
import { allActionTypes } from '@common/enums'
import { localizationForActionType } from '~/localization'
// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(type: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return capitalize(localizationForActionType.get(type) ?? type ?? '')
}

export function useActionTypeCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'type',
      headerName: 'Тип',
      type: 'singleSelect',
      valueOptions: allActionTypes.map(getValue),
      valueGetter: getValue,
      minWidth: 140,
      flex: 1
    }),
    []
  )

  return col
}
