// Project
import type { RolePrimary } from '~/types'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export function useRoleCol(roles: RolePrimary[] | null | undefined) {
  const roleNameForId = React.useMemo(
    () =>
      new Map(
        roles?.map((role) => [role.id, capitalize(role.name, true)]) ?? []
      ),
    [roles]
  )

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'roleId',
      headerName: 'Роль',
      type: 'singleSelect',
      valueOptions: Array.from(roleNameForId.values()).toSorted(),
      valueGetter: (roleId) => roleNameForId.get(roleId),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/roles"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row.roleId}
        />
      ),
      minWidth: 140,
      flex: 1
    }),
    [roleNameForId]
  )

  return col
}
