// Project
import type { UserPrimary } from '~/types'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export function useInitiatorCol(users: UserPrimary[] | null | undefined) {
  const userLoginForId = React.useMemo(
    () =>
      new Map(
        users?.map((user) => [user.id, capitalize(user.login, true)]) ?? []
      ),
    [users]
  )

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'initiatorId',
      headerName: 'Инициатор',
      type: 'singleSelect',
      valueOptions: Array.from(userLoginForId.values()).toSorted(),
      valueGetter: (initiatorId) => userLoginForId.get(initiatorId),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/users"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row.initiatorId}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          semiTransparent={params.row.atomic === false ? true : undefined}
        />
      ),
      minWidth: 140,
      flex: 1
    }),
    [userLoginForId]
  )

  return col
}
