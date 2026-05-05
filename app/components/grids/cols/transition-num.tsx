// Project
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

// export function useTransitionNumCol() {
//   const col: GridColDef = React.useMemo(
//     () => ({
//       field: 'transitionNum',
//       headerName: 'Номер',
//       type: 'number',
//       minWidth: 100,
//       flex: 0.01
//     }),
//     []
//   )
//   return col
// }

export function useTransitionNumCol(
  transitionNumField: string,
  header: boolean,
  hrefPrefix: string,
  disableRef?: boolean
) {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'transitionNum',
      headerName: 'Переход',
      hideable: !header,
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix={hrefPrefix}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          hrefPath={`${params.row[transitionNumField]}`}
          header={header}
          disableCapitalize
          disableRef={disableRef}
        />
      ),
      minWidth: 70,
      flex: 1
    }),
    [transitionNumField, header, hrefPrefix, disableRef]
  )
  return col
}
