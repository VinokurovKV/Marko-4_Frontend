// Project
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

export function useLoginCol(
  userIdField: string,
  header: boolean,
  disableRef?: boolean
) {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'login',
      headerName: 'Логин',
      hideable: !header,
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/users"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row[userIdField]}
          header={header}
          disableCapitalize
          disableRef={disableRef}
        />
      ),
      minWidth: 140,
      flex: 1
    }),
    [userIdField, header, disableRef]
  )
  return col
}
