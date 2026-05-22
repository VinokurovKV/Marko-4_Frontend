// Project
import type { RolePrimary, UserTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useDialogs } from '~/providers/dialogs'
import { readRolesPrimary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { HorizontalTwoPartsContainer } from '~/components/containers'
import { UpdateUserFormDialog } from '~/components/forms/resources/update-user'
import {
  ColumnViewer,
  ColumnViewerActions,
  ColumnViewerBlock,
  ColumnViewerItem,
  ColumnViewerRef,
  ColumnViewerText
} from '../common'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Other
import capitalize from 'capitalize'

export interface UserViewerProps {
  role: RolePrimary | null
  user: UserTertiary
}

export function UserViewer({ role, user }: UserViewerProps) {
  const navigate = useNavigate()
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )
  const dialogs = useDialogs()

  // Edit form states
  const [efRoles, setEfRoles] = React.useState<RolePrimary[]>([])
  const [updatedUserId, setUpdatedUserId] = React.useState<number | null>(null)

  const handleUpdateClick = React.useCallback(async () => {
    const [roles] = await Promise.all([readRolesPrimary()])
    setEfRoles(roles ?? [])
    setUpdatedUserId(user.id)
  }, [user])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedUserId(null)
  }, [setUpdatedUserId])

  const handleDeleteClick = React.useCallback(async () => {
    const confirmText = `удалить пользователя '${user.login}'?`
    const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
      severity: 'error',
      okText: 'Удалить',
      cancelText: 'Отменить'
    })
    if (confirmed) {
      try {
        await serverConnector.deleteUser({
          id: user.id
        })
        notifier.showSuccess(`пользователь «${user.login}» удален`)
        void navigate('/users')
      } catch (error) {
        notifier.showError(error)
      }
    }
  }, [navigate, dialogs, user])

  return (
    <>
      <HorizontalTwoPartsContainer
        proportions="EQUAL"
        title={['Пользователь', `${user.login}`]}
      >
        <ColumnViewer>
          <ColumnViewerBlock title="действия">
            <ColumnViewerActions
              onUpdateClick={
                rightsSet.has('UPDATE_USER') ? handleUpdateClick : undefined
              }
              onDeleteClick={
                rightsSet.has('DELETE_USER') ? handleDeleteClick : undefined
              }
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="основная информация">
            <ColumnViewerItem field="логин" val={user.login} />
            <ColumnViewerItem field="фамилия" val={user.surname} />
            <ColumnViewerItem field="имя" val={user.forename} />
            <ColumnViewerItem field="отчество" val={user.patronymic} />
            <ColumnViewerItem field="e-mail" val={user.email} />
            <ColumnViewerItem field="телефон" val={user.phone} />
            <ColumnViewerRef
              field="роль"
              text={role?.name ?? '???'}
              href={role !== null ? `/roles/${role.id}` : undefined}
            />
            <ColumnViewerRef
              field="история"
              text="ПЕРЕЙТИ"
              href={`/history/users/${user.id}`}
            />
          </ColumnViewerBlock>
        </ColumnViewer>
        <ColumnViewer>
          <ColumnViewerBlock title="описание">
            <ColumnViewerText text={user.description?.text} emptyText="нет" />
          </ColumnViewerBlock>
        </ColumnViewer>
      </HorizontalTwoPartsContainer>
      <UpdateUserFormDialog
        key={updatedUserId}
        roles={efRoles}
        userId={updatedUserId}
        setUserId={setUpdatedUserId}
        initialUser={user}
        onSuccessUpdateUser={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
