// Project
import type { TagSecondary, TagTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateTagFormDialog } from '~/components/forms/resources/create-tag'
import { UpdateTagFormDialog } from '~/components/forms/resources/update-tag'
import { type GridProps, Grid } from '../grid'
import { useCodeCol, type ActionsColProps, useActionsCol } from '../cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_TAGS_IN_MESSAGES = 3

export interface TagsGridProps {
  tags: TagSecondary[]
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function TagsGrid(props: TagsGridProps) {
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
  const [updatedTagId, setUpdatedTagId] = React.useState<number | null>(null)
  const [initialUpdatedTag, setInitialUpdatedTag] =
    React.useState<TagTertiary | null>(null)

  const tagCodeForId = React.useMemo(
    () => new Map(props.tags.map((tag) => [tag.id, tag.code])),
    [props.tags]
  )

  const rows: GridValidRowModel[] = props.tags

  const readCols = [useCodeCol('id', true, '/tags', navigationMode)]

  const navigationModeReadCols = React.useMemo(() => [readCols[0]], [readCols])

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      update: rightsSet.has('UPDATE_TAG')
        ? {
            action: async (rowId) => {
              try {
                const initialTag = await serverConnector.readTag(
                  {
                    id: rowId
                  },
                  {
                    scope: 'UP_TO_TERTIARY_PROPS'
                  }
                )
                setUpdatedTagId(rowId)
                setInitialUpdatedTag(initialTag)
              } catch {
                notifier.showWarning(
                  `не удалось загрузить тег с идентификатором ${rowId}`
                )
              }
            }
          }
        : undefined,
      delete: rightsSet.has('DELETE_TAG')
        ? {
            prepareConfirmMessage: (rowId) =>
              `удалить тег «${tagCodeForId.get(rowId) ?? ''}»?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteTag({
                  id: rowId
                })
                notifier.showSuccess(
                  `тег «${tagCodeForId.get(rowId) ?? ''}» удален`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, tagCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      ...(navigationMode ? navigationModeReadCols : readCols),
      ...(rightsSet.has('UPDATE_TAG') || rightsSet.has('DELETE_TAG')
        ? [actionsCol]
        : [])
    ],
    [navigationMode, rightsSet, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof TagSecondary)[],
    []
  )

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_TAG')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedTagCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_TAGS_IN_MESSAGES)
        .map((id) => tagCodeForId.get(id) ?? '')
    },
    [tagCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_TAG')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedTagCodes = getDisplayedTagCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedTagCodes.length
              return `удалить тег${count === 1 ? '' : 'и'}${displayedTagCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedTagCodes = getDisplayedTagCodes(rowIds)
              try {
                await serverConnector.deleteTags({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedTagCodes.length
                notifier.showSuccess(
                  `тег${count === 1 ? '' : 'и'}${displayedTagCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? '' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, rightsSet, getDisplayedTagCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedTagId(null)
  }, [setUpdatedTagId])

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId ? `/tags/${rowId}` : '/tags'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="TAGS"
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
      <CreateTagFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateTag={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
      <UpdateTagFormDialog
        key={updatedTagId}
        tagId={updatedTagId}
        setTagId={setUpdatedTagId}
        initialTag={initialUpdatedTag}
        onSuccessUpdateTag={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
