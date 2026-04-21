// Project
import type { RolePrimary } from '~/types'
import { usePopupPreviewVisibilitySettings } from '~/hooks/popup-preview-visibility'
import { GridRefCell } from '../cells/grid-ref-cell'
import { RoleHoverPreview } from '~/components/roles/role-hover-preview'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export function useRoleCol(roles: RolePrimary[] | null | undefined) {
  const { settings } = usePopupPreviewVisibilitySettings()

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
          hoverPreview={
            settings.roleRights
              ? {
                  renderContent: (active) => (
                    <RoleHoverPreview
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      roleId={params.row.roleId as number}
                      active={active}
                      text={params.value}
                    />
                  )
                }
              : undefined
          }
        />
      ),
      minWidth: 140,
      flex: 1
    }),
    [roleNameForId, settings.roleRights]
  )

  return col
}
