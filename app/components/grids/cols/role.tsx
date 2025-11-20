// Project
import type { ReadRolesWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/roles.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

type Role = DtoWithoutEnums<ReadRolesWithPrimaryPropsSuccessResultItemDto>

export function useRoleCol(initialRoles: Role[] | null) {
  const notifier = useNotifier()

  const [roles, setRoles] = React.useState<Role[] | null>(initialRoles)

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'ROLE'
      },
      (data) => {
        void (async () => {
          const scope = data.updateScope
          if (scope.primaryProps) {
            try {
              const roles = await serverConnector.readRoles({
                scope: 'PRIMARY_PROPS'
              })
              setRoles(roles)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список ролей'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setRoles])

  const roleNameForId = React.useMemo(
    () => new Map(roles?.map((role) => [role.id, capitalize(role.name)]) ?? []),
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          refObjectId={params.row.roleId}
          text={params.value}
          hrefPrefix="/roles"
        />
      ),
      minWidth: 150,
      flex: 1
    }),
    []
  )

  return col
}
