// Project
import type { ReadTagsWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tags.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateTagFormDialog } from '~/components/forms/resources/create-tag'
import { type GridProps, Grid } from '../grid'
import { useCodeCol, type ActionsColProps, useActionsCol } from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_TAGS_IN_MESSAGES = 3

type Tag = DtoWithoutEnums<ReadTagsWithUpToSecondaryPropsSuccessResultItemDto>

export interface TagsGridProps {
  initialTags: Tag[]
}

export function TagsGrid(props: TagsGridProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet =
    meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const [tags, setTags] = React.useState<Tag[]>(props.initialTags)

  const tagCodeForId = React.useMemo(
    () => new Map(tags.map((tag) => [tag.id, tag.code])),
    [tags]
  )

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'TAG'
      },
      (data) => {
        void (async () => {
          const scope = data.updateScope
          if (scope.primaryProps || scope.secondaryProps) {
            try {
              const tags = await serverConnector.readTags({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              setTags(tags)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список тегов'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setTags])

  const rows: GridValidRowModel[] = tags

  const readCols = [useCodeCol('id', true, '/tags')]

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      delete: {
        prepareConfirmMessage: (rowId) =>
          `удалить тег '${tagCodeForId.get(rowId) ?? ''}'?`,
        action: async (rowId) => {
          try {
            await serverConnector.deleteTag({
              id: rowId
            })
            notifier.showSuccess(
              `тег '${tagCodeForId.get(rowId) ?? ''}' удален`
            )
          } catch (error) {
            notifier.showError(error)
          }
        }
      }
    }),
    [tagCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      ...readCols,
      ...(rightsSet.has('UPDATE_TAG') || rightsSet.has('DELETE_TAG')
        ? [actionsCol]
        : [])
    ],
    [rightsSet, readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(() => [] as (keyof Tag)[], [])

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
              return `удалить тег${count === 1 ? '' : 'и'}${displayedTagCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
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
                  `тег${count === 1 ? '' : 'и'}${displayedTagCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? '' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [rightsSet, getDisplayedTagCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  return (
    <>
      <Grid
        localSaveKey="TAGS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateTagFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateTag={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
