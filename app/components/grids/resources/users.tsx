// Project
import type { RolePrimary, UserSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateUserFormDialog } from '~/components/forms/resources/create-user'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useEmailCol,
  useForenameCol,
  useLoginCol,
  usePatronymicCol,
  usePhoneCol,
  useRoleCol,
  useSurnameCol
} from '../cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_USERS_IN_MESSAGES = 3

export interface UsersGridProps {
  roles: RolePrimary[] | null
  users: UserSecondary[]
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function UsersGrid(props: UsersGridProps) {
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

  const userLoginForId = React.useMemo(
    () => new Map(props.users.map((user) => [user.id, user.login])),
    [props.users]
  )

  const rows: GridValidRowModel[] = props.users

  const readCols = [
    useLoginCol('id', true, navigationMode),
    useSurnameCol(),
    useForenameCol(),
    usePatronymicCol(),
    useEmailCol(),
    usePhoneCol(),
    useRoleCol(props.roles)
  ]

  const navigationModeReadCols = React.useMemo(() => [readCols[0]], [readCols])

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      delete: rightsSet.has('DELETE_USER')
        ? {
            prepareConfirmMessage: (rowId) =>
              `удалить пользователя '${userLoginForId.get(rowId) ?? ''}'?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteUser({
                  id: rowId
                })
                notifier.showSuccess(
                  `пользователь '${userLoginForId.get(rowId) ?? ''}' удален`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, userLoginForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () =>
      navigationMode
        ? navigationModeReadCols
        : [
            ...readCols,
            ...(rightsSet.has('UPDATE_USER') || rightsSet.has('DELETE_USER')
              ? [actionsCol]
              : [])
          ],
    [navigationMode, rightsSet, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => ['phone'] as (keyof UserSecondary)[],
    []
  )

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_USER')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedUserLogins = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_USERS_IN_MESSAGES)
        .map((id) => userLoginForId.get(id) ?? '')
    },
    [userLoginForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_USER')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedUserLogins = getDisplayedUserLogins(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedUserLogins.length
              return `удалить пользовател${count === 1 ? 'я' : 'ей'}${displayedUserLogins.map((login) => ` '${login}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedUserLogins = getDisplayedUserLogins(rowIds)
              try {
                await serverConnector.deleteUsers({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedUserLogins.length
                notifier.showSuccess(
                  `пользовател${count === 1 ? 'ь' : 'и'}${displayedUserLogins.map((login) => ` '${login}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? '' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, rightsSet, getDisplayedUserLogins]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/users/${rowId}`
          : '/users'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="USERS"
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
      <CreateUserFormDialog
        roles={props.roles}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateUser={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
