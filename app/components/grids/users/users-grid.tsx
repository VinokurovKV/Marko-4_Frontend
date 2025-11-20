// Project
import type { ReadRolesWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/roles.dto'
import type { ReadUsersWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/users.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { Grid } from '../grid'
import {
  useLoginCol,
  useSurnameCol,
  useForenameCol,
  usePatronymicCol,
  useEmailCol,
  usePhoneCol,
  useRoleCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

type Role = DtoWithoutEnums<ReadRolesWithPrimaryPropsSuccessResultItemDto>
type User = DtoWithoutEnums<ReadUsersWithUpToSecondaryPropsSuccessResultItemDto>

export interface UsersGridProps {
  initialRoles: Role[] | null
  initialUsers: User[]
}

export function UsersGrid(props: UsersGridProps) {
  const notifier = useNotifier()

  const [users, setUsers] = React.useState<User[]>(props.initialUsers)

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

  const cols: GridColDef[] = [
    useLoginCol('id', true),
    useSurnameCol(),
    useForenameCol(),
    usePatronymicCol(),
    useEmailCol(),
    usePhoneCol(),
    useRoleCol(props.initialRoles)
  ]

  return <Grid localSaveKey="USERS" cols={cols} rows={rows} />
}
