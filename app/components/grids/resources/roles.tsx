// Project
import type { RoleSecondary, RoleTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateRoleFormDialog } from '~/components/forms/resources/create-role'
import { UpdateRoleFormDialog } from '~/components/forms/resources/update-role'
import { type GridProps, Grid } from '../grid'
import { useRoleNameCol, type ActionsColProps, useActionsCol } from '../cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_ROLES_IN_MESSAGES = 3

export interface RolesGridProps {
  roles: RoleSecondary[]
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function RolesGrid(props: RolesGridProps) {
  const navigationMode = props.navigationMode ?? false
  const navigate = useNavigate()
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)
  const [updatedRoleId, setUpdatedRoleId] = React.useState<number | null>(null)
  const [initialUpdatedRole, setInitialUpdatedRole] =
    React.useState<RoleTertiary | null>(null)

  const roleNameForId = React.useMemo(
    () => new Map(props.roles.map((role) => [role.id, role.name])),
    [props.roles]
  )

  const rows: GridValidRowModel[] = props.roles

  const readCols = [useRoleNameCol('id', true, navigationMode)]

  const navigationModeReadCols = React.useMemo(() => [readCols[0]], [readCols])

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      update: rightsSet.has('UPDATE_ROLE')
        ? {
            action: async (rowId) => {
              try {
                const initialRole = await serverConnector.readRole(
                  {
                    id: rowId
                  },
                  {
                    scope: 'UP_TO_TERTIARY_PROPS'
                  }
                )
                setUpdatedRoleId(rowId)
                setInitialUpdatedRole(initialRole)
              } catch {
                notifier.showWarning(
                  `не удалось загрузить роль с идентификатором ${rowId}`
                )
              }
            }
          }
        : undefined,
      delete: rightsSet.has('DELETE_ROLE')
        ? {
            prepareConfirmMessage: (rowId) =>
              `удалить роль «${roleNameForId.get(rowId) ?? ''}»?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteRole({
                  id: rowId
                })
                notifier.showSuccess(
                  `роль «${roleNameForId.get(rowId) ?? ''}» удалена`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, roleNameForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      ...(navigationMode ? navigationModeReadCols : readCols),
      ...(rightsSet.has('UPDATE_ROLE') || rightsSet.has('DELETE_ROLE')
        ? [actionsCol]
        : [])
    ],
    [navigationMode, rightsSet, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof RoleSecondary)[],
    []
  )

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

  const getDisplayedRoleNames = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_ROLES_IN_MESSAGES)
        .map((id) => roleNameForId.get(id) ?? '')
    },
    [roleNameForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_ROLE')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedRoleNames = getDisplayedRoleNames(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedRoleNames.length
              return `удалить рол${count === 1 ? 'ь' : 'и'}${displayedRoleNames.map((name) => ` «${name}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedRoleNames = getDisplayedRoleNames(rowIds)
              try {
                await serverConnector.deleteRoles({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedRoleNames.length
                notifier.showSuccess(
                  `рол${count === 1 ? 'ь' : 'и'}${displayedRoleNames.map((name) => ` «${name}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'а' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, rightsSet, getDisplayedRoleNames]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedRoleId(null)
  }, [setUpdatedRoleId])

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/roles/${rowId}`
          : '/roles'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="ROLES"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
        selectedRowId={
          navigationMode ? props.navigationModeSelectedRowId : undefined
        }
        navigationModeOnRowClick={handleNavigationModeRowClick}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateRoleFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateRole={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
      <UpdateRoleFormDialog
        key={updatedRoleId}
        roleId={updatedRoleId}
        setRoleId={setUpdatedRoleId}
        initialRole={initialUpdatedRole}
        onSuccessUpdateRole={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
