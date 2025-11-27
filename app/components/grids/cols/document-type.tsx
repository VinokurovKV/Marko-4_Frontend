// Project
import { allDocumentTypes } from '@common/enums'
import { localizationForDocumentType } from '~/localization/document-type'
// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

function getValue(type: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return capitalize(localizationForDocumentType.get(type) ?? type ?? '')
}

export function useDocumentTypeCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'type',
      headerName: 'Тип',
      type: 'singleSelect',
      valueOptions: allDocumentTypes.map(getValue),
      valueGetter: getValue,
      minWidth: 150,
      flex: 1
    }),
    []
  )

  return col
}
