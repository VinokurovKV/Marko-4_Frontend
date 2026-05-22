// Project
import type { TagPrimary, DbcTertiary, TestPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useDialogs } from '~/providers/dialogs'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { FlagIcon } from '~/components/icons'
import { HorizontalTwoPartsContainer } from '~/components/containers'
import { UpdateDbcFormDialog } from '~/components/forms/resources/update-dbc'
import {
  ColumnViewer,
  ColumnViewerActions,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerFile,
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

export interface DbcViewerProps {
  tags: TagPrimary[] | null
  dbc: DbcTertiary
  tests: TestPrimary[] | null
}

export function DbcViewer({ tags, dbc, tests }: DbcViewerProps) {
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
  const [updatedDbcId, setUpdatedDbcId] = React.useState<number | null>(null)

  const handleUpdateClick = React.useCallback(() => {
    setUpdatedDbcId(dbc.id)
    return Promise.resolve()
  }, [dbc])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedDbcId(null)
  }, [setUpdatedDbcId])

  const handleDeleteClick = React.useCallback(async () => {
    const confirmText = `удалить базовую конфигурацию '${dbc.code}'?`
    const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
      severity: 'error',
      okText: 'Удалить',
      cancelText: 'Отменить'
    })
    if (confirmed) {
      try {
        await serverConnector.deleteDbc({
          id: dbc.id
        })
        notifier.showSuccess(`базовая конфигурация «${dbc.code}» удалена`)
        void navigate('/dbcs')
      } catch (error) {
        notifier.showError(error)
      }
    }
  }, [navigate, dialogs, dbc])

  const getConfigBlob = React.useCallback(async () => {
    try {
      const data = await serverConnector.readDbcConfig({
        id: dbc.id
      })
      return data
    } catch (error) {
      notifier.showError(error)
      return null
    }
  }, [dbc])

  return (
    <>
      <HorizontalTwoPartsContainer
        proportions="EQUAL"
        title={['Базовая конфигурация', `${dbc.code}`]}
      >
        <ColumnViewer>
          <ColumnViewerBlock title="действия">
            <ColumnViewerActions
              onUpdateClick={
                rightsSet.has('UPDATE_DBC') ? handleUpdateClick : undefined
              }
              onDeleteClick={
                rightsSet.has('DELETE_DBC') ? handleDeleteClick : undefined
              }
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="основная информация">
            <ColumnViewerItem field="код" val={dbc.code} />
            <ColumnViewerItem field="название" val={dbc.name} />
            <ColumnViewerItem
              field="готовность"
              Icon={
                <FlagIcon
                  flag={dbc.prepared}
                  truePrompt="конфигурация загружена"
                  falsePrompt="конфигурация не загружена"
                />
              }
            />
            {dbc.config !== null ? (
              <ColumnViewerFile
                id={dbc.id}
                field="конфигурация"
                fieldFull={`базовая конфигурация «${dbc.code}»`}
                name={`${dbc.code}`}
                size={dbc.config.size}
                format={dbc.config.format}
                getFileBlob={getConfigBlob}
                withBrowse
              />
            ) : (
              <ColumnViewerItem field="конфигурация" />
            )}
            <ColumnViewerRef
              field="история"
              text="ПЕРЕЙТИ"
              href={`/history/dbcs/${dbc.id}`}
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock
            title={`тесты${tests !== null && tests.length > 0 ? ` (${tests.length})` : ''}`}
          >
            <ColumnViewerChipsBlock
              emptyText={tests !== null ? 'нет' : '???'}
              items={(tests ?? []).map((test) => ({
                text: test.code,
                href: `/hierarchy/tests/${test.id}`
              }))}
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="теги">
            <ColumnViewerChipsBlock
              emptyText={tags !== null ? 'нет' : '???'}
              items={(tags ?? []).map((tag) => ({
                text: tag.code,
                href: `/tags/${tag.id}`
              }))}
            />
          </ColumnViewerBlock>
        </ColumnViewer>
        <ColumnViewer>
          <ColumnViewerBlock title="описание">
            <ColumnViewerText text={dbc.description?.text} emptyText="нет" />
          </ColumnViewerBlock>
        </ColumnViewer>
      </HorizontalTwoPartsContainer>
      <UpdateDbcFormDialog
        key={updatedDbcId}
        dbcId={updatedDbcId}
        setDbcId={setUpdatedDbcId}
        initialDbc={dbc}
        onSuccessUpdateDbc={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
