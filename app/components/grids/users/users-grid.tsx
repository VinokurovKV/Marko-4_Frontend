// Project
import type { ReadRolesWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/roles.dto'
import type { ReadUsersWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/users.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
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

  const [users, setUsers] = React.useState<User[]>(props.initialUsers)

  const userLoginForId = React.useMemo(
    () => new Map(users.map((user) => [user.id, user.login])),
    [users]
  )

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'USER'
      },
      (data) => {
        void (async () => {
          const scope = data.updateScope
          if (scope.primaryProps || scope.secondaryProps) {
            try {
              const users = await serverConnector.readUsers({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              setUsers(users)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список пользователей'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setUsers])

  const rows: GridValidRowModel[] = users

  const readCols = [
    useLoginCol('id', true),
    useSurnameCol(),
    useForenameCol(),
    usePatronymicCol(),
    useEmailCol(),
    usePhoneCol(),
    useRoleCol(props.initialRoles)
  ]

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      delete: {
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
            throw error
          }
        }
      }
    }),
    [userLoginForId]
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

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_USER')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedUserLogins = rowIds
                .slice(0, MAX_USERS_IN_MESSAGES)
                .map((rowId) => userLoginForId.get(rowId) ?? '')
              return `удалить пользовател${rowIds.length === 1 ? 'я' : 'ей'}${displayedUserLogins.map((login) => ` '${login}'`).join()}${rowIds.length > displayedUserLogins.length ? ` и еще ${rowIds.length - displayedUserLogins.length}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedUserLogins = rowIds
                .slice(0, MAX_USERS_IN_MESSAGES)
                .map((rowId) => userLoginForId.get(rowId) ?? '')
              try {
                await serverConnector.deleteUsers({
                  ids: rowIds
                })
                notifier.showSuccess(
                  `пользователи${displayedUserLogins.map((login) => ` '${login}'`).join()}${rowIds.length > displayedUserLogins.length ? ` и еще ${rowIds.length - displayedUserLogins.length}` : ''} удалены`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [rightsSet, userLoginForId]
  )

  return (
    <Grid
      localSaveKey="USERS"
      cols={cols}
      rows={rows}
      defaultHiddenFields={defaultHiddenFields}
      create={{}}
      deleteMany={deleteManyProps}
    />
  )
}
