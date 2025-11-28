// Project
import type { ReadRolesWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/roles.dto'
import type { ReadUsersWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/users.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useRolesSubscription,
  useUsersSubscription
} from '~/hooks/subscriptions'
import { CreateUserFormDialog } from '~/components/forms/resources/create-user'
import { type GridProps, Grid } from '../grid'
import {
  useLoginCol,
  useSurnameCol,
  useForenameCol,
  usePatronymicCol,
  useEmailCol,
  usePhoneCol,
  useRoleCol,
  type ActionsColProps,
  useActionsCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_USERS_IN_MESSAGES = 3

type Role = DtoWithoutEnums<ReadRolesWithPrimaryPropsSuccessResultItemDto>
type User = DtoWithoutEnums<ReadUsersWithUpToSecondaryPropsSuccessResultItemDto>

export interface UsersGridProps {
  initialRoles: Role[] | null
  initialUsers: User[]
}

export function UsersGrid(props: UsersGridProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet =
    meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const [roles, setRoles] = React.useState<Role[] | null>(props.initialRoles)
  const [users, setUsers] = React.useState<User[]>(props.initialUsers)

  useRolesSubscription('PRIMARY_PROPS', setRoles)
  useUsersSubscription('UP_TO_SECONDARY_PROPS', setUsers)

  const userLoginForId = React.useMemo(
    () => new Map(users.map((user) => [user.id, user.login])),
    [users]
  )

  const rows: GridValidRowModel[] = users

  const readCols = [
    useLoginCol('id', true),
    useSurnameCol(),
    useForenameCol(),
    usePatronymicCol(),
    useEmailCol(),
    usePhoneCol(),
    useRoleCol(roles)
  ]

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
    [rightsSet, userLoginForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      ...readCols,
      ...(rightsSet.has('UPDATE_USER') || rightsSet.has('DELETE_USER')
        ? [actionsCol]
        : [])
    ],
    [rightsSet, readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => ['phone'] as (keyof User)[],
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
    [rightsSet, getDisplayedUserLogins]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  return (
    <>
      <Grid
        localSaveKey="USERS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateUserFormDialog
        roles={roles}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateUser={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
