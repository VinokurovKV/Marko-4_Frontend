// Project
import type { RoleTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useDialogs } from '~/providers/dialogs'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { localizationForRight } from '~/localization'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import { UpdateRoleFormDialog } from '~/components/forms/resources/update-role'
import {
  ColumnViewer,
  ColumnViewerActions,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
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

export interface RoleViewerProps {
  role: RoleTertiary
}

export function RoleViewer({ role }: RoleViewerProps) {
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
  const [updatedRoleId, setUpdatedRoleId] = React.useState<number | null>(null)

  const handleUpdateClick = React.useCallback(() => {
    setUpdatedRoleId(role.id)
    return Promise.resolve()
  }, [role])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedRoleId(null)
  }, [setUpdatedRoleId])

  const handleDeleteClick = React.useCallback(async () => {
    const confirmText = `удалить роль '${role.name}'?`
    const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
      severity: 'error',
      okText: 'Удалить',
      cancelText: 'Отменить'
    })
    if (confirmed) {
      try {
        await serverConnector.deleteRole({
          id: role.id
        })
        notifier.showSuccess(`роль «${role.name}» удалена`)
        void navigate('/roles')
      } catch (error) {
        notifier.showError(error)
      }
    }
  }, [navigate, dialogs, role])

  return (
    <>
      <HorizontalTwoPartsContainer
        proportions="EQUAL"
        title={['Роль', `${role.name}`]}
      >
        <VerticalTwoPartsContainer proportions="needed_rest">
          <ColumnViewer>
            <ColumnViewerBlock title="действия">
              <ColumnViewerActions
                onUpdateClick={
                  rightsSet.has('UPDATE_ROLE') ? handleUpdateClick : undefined
                }
                onDeleteClick={
                  rightsSet.has('DELETE_ROLE') ? handleDeleteClick : undefined
                }
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="основная информация">
              <ColumnViewerItem field="название" val={role.name} />
              <ColumnViewerRef
                field="история"
                text="ПЕРЕЙТИ"
                href={`/history/roles/${role.id}`}
              />
            </ColumnViewerBlock>
          </ColumnViewer>
          <ColumnViewer>
            <ColumnViewerBlock
              title={`права${role.rights.length > 0 ? ` (${role.rights.length})` : ''}`}
            >
              <ColumnViewerChipsBlock
                emptyText="нет"
                items={role.rights.map((right) => ({
                  text: localizationForRight.get(right) ?? ''
                }))}
              />
            </ColumnViewerBlock>
          </ColumnViewer>
        </VerticalTwoPartsContainer>
        <ColumnViewer>
          <ColumnViewerBlock title="описание">
            <ColumnViewerText text={role.description?.text} emptyText="нет" />
          </ColumnViewerBlock>
        </ColumnViewer>
      </HorizontalTwoPartsContainer>
      <UpdateRoleFormDialog
        key={updatedRoleId}
        roleId={updatedRoleId}
        setRoleId={setUpdatedRoleId}
        initialRole={role}
        onSuccessUpdateRole={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
