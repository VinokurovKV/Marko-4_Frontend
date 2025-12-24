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
      headerName: 'Происх.',
      type: 'singleSelect',
      valueOptions: allRequirementOrigins.map(getValue),
      valueGetter: getValue,
      rowSpanValueGetter: (value, row) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions
        return row ? `${row.id}-${value}` : value
      },
      minWidth: 100,
      flex: 1
    }),
    []
  )

  return col
}
