// Project
import type { ReadRolesWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/roles.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateRoleFormDialog } from '~/components/forms/resources/create-role'
import { type GridProps, Grid } from '../grid'
import { useRoleNameCol, type ActionsColProps, useActionsCol } from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_ROLES_IN_MESSAGES = 3

type Role = DtoWithoutEnums<ReadRolesWithUpToSecondaryPropsSuccessResultItemDto>

export interface RolesGridProps {
  initialRoles: Role[]
}

export function RolesGrid(props: RolesGridProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet =
    meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const [roles, setRoles] = React.useState<Role[]>(props.initialRoles)

  const roleNameForId = React.useMemo(
    () => new Map(roles.map((role) => [role.id, role.name])),
    [roles]
  )

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'ROLE'
      },
      (data) => {
        void (async () => {
          const scope = data.updateScope
          if (scope.primaryProps || scope.secondaryProps) {
            try {
              const roles = await serverConnector.readRoles({
                scope: 'UP_TO_SECONDARY_PROPS'
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

  const rows: GridValidRowModel[] = roles

  const readCols = [useRoleNameCol('id', true)]

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      delete: {
        prepareConfirmMessage: (rowId) =>
          `удалить роль '${roleNameForId.get(rowId) ?? ''}'?`,
        action: async (rowId) => {
          try {
            await serverConnector.deleteRole({
              id: rowId
            })
            notifier.showSuccess(
              `роль '${roleNameForId.get(rowId) ?? ''}' удалена`
            )
          } catch (error) {
            notifier.showError(error)
            throw error
          }
        }
      }
    }),
    [roleNameForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      ...readCols,
      ...(rightsSet.has('UPDATE_ROLE') || rightsSet.has('DELETE_ROLE')
        ? [actionsCol]
        : [])
    ],
    [rightsSet, readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(() => [] as (keyof Role)[], [])

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_ROLE')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedRoleNames = React.useCallback((ids: number[]) => {
    return ids
      .slice(0, MAX_ROLES_IN_MESSAGES)
      .map((id) => roleNameForId.get(id) ?? '')
  }, [])

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_ROLE')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedRoleNames = getDisplayedRoleNames(rowIds)
              const hiddenCount = rowIds.length - displayedRoleNames.length
              return `удалить рол${rowIds.length === 1 ? 'ь' : 'и'}${displayedRoleNames.map((name) => ` '${name}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedRoleNames = getDisplayedRoleNames(rowIds)
              try {
                await serverConnector.deleteRoles({
                  ids: rowIds
                })
                const hiddenCount = rowIds.length - displayedRoleNames.length
                notifier.showSuccess(
                  `роли${displayedRoleNames.map((name) => ` '${name}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удалены`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [rightsSet, roleNameForId, getDisplayedRoleNames]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  return (
    <>
      <Grid
        localSaveKey="ROLES"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateRoleFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateRole={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
