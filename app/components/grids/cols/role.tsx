// Project
import type { ReadRolesWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/roles.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

type Role = DtoWithoutEnums<ReadRolesWithPrimaryPropsSuccessResultItemDto>

export function useRoleCol(roles: Role[] | null | undefined) {
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
      minWidth: 150,
      flex: 1
    }),
    []
  )

  return col
}
