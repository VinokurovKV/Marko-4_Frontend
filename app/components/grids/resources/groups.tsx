// Project
import type { ReadGroupsWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/groups.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useGroupsSubscription } from '~/hooks/resources'
import { CreateGroupFormDialog } from '~/components/forms/resources/create-group'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useNameCol,
  useNumCol,
  useSubgroupsCountCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_GROUPS_IN_MESSAGES = 3

type Group =
  DtoWithoutEnums<ReadGroupsWithUpToSecondaryPropsSuccessResultItemDto>

export interface GroupsGridProps {
  initialGroups: Group[]
  navigationMode?: boolean
}

export function GroupsGrid(props: GroupsGridProps) {
  const navigationMode = props.navigationMode ?? false
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const [groups, setGroups] = React.useState<Group[]>(props.initialGroups)

  useGroupsSubscription('UP_TO_SECONDARY_PROPS', setGroups)

  const groupCodeForId = React.useMemo(
    () => new Map(groups.map((group) => [group.id, group.code])),
    [groups]
  )

  const rows: GridValidRowModel[] = groups

  const readCols = [
    useCodeCol('id', true, '/groups'),
    useNameCol(),
    useNumCol(),
    useSubgroupsCountCol()
  ]

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      delete: rightsSet.has('DELETE_GROUP')
        ? {
            prepareConfirmMessage: (rowId) => {
              return `удалить группу тестов '${groupCodeForId.get(rowId) ?? ''}'?`
            },
            action: async (rowId) => {
              try {
                await serverConnector.deleteGroup({
                  id: rowId
                })
                notifier.showSuccess(
                  `группа тестов '${groupCodeForId.get(rowId) ?? ''}' удалена`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, groupCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      ...readCols,
      ...(rightsSet.has('UPDATE_GROUP') || rightsSet.has('DELETE_GROUP')
        ? [actionsCol]
        : [])
    ],
    [rightsSet, readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(() => [] as (keyof Group)[], [])

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_GROUP')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedGroupCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_GROUPS_IN_MESSAGES)
        .map((id) => groupCodeForId.get(id) ?? '')
    },
    [groupCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_GROUP')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedGroupCodes = getDisplayedGroupCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedGroupCodes.length
              return `удалить групп${count === 1 ? 'у' : 'ы'} тестов ${displayedGroupCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedGroupCodes = getDisplayedGroupCodes(rowIds)
              try {
                await serverConnector.deleteGroups({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedGroupCodes.length
                notifier.showSuccess(
                  `групп${count === 1 ? 'а' : 'ы'} тестов${displayedGroupCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'а' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, rightsSet, getDisplayedGroupCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  return (
    <>
      <Grid
        localSaveKey="GROUPS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateGroupFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateGroup={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
