// Project
import type { ReadGroupsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/groups.dto'
import type { ReadSubgroupsWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/subgroups.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useSubgroupsSubscription,
  useGroupsSubscription
} from '~/hooks/resources'
import { CreateSubgroupFormDialog } from '~/components/forms/resources/create-subgroup'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useGroupCol,
  useNameCol,
  useNumInGroupCol,
  useTestsCountCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_SUBGROUPS_IN_MESSAGES = 3

type Group = DtoWithoutEnums<ReadGroupsWithPrimaryPropsSuccessResultItemDto>
type Subgroup =
  DtoWithoutEnums<ReadSubgroupsWithUpToSecondaryPropsSuccessResultItemDto>

export interface SubgroupsGridProps {
  initialGroups: Group[] | null
  initialSubgroups: Subgroup[]
  navigationMode?: boolean
}

export function SubgroupsGrid(props: SubgroupsGridProps) {
  const navigationMode = props.navigationMode ?? false
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const [groups, setGroups] = React.useState<Group[] | null>(
    props.initialGroups
  )
  const [subgroups, setSubgroups] = React.useState<Subgroup[]>(
    props.initialSubgroups
  )

  useGroupsSubscription('PRIMARY_PROPS', setGroups)
  useSubgroupsSubscription('UP_TO_SECONDARY_PROPS', setSubgroups)

  const subgroupCodeForId = React.useMemo(
    () => new Map(subgroups.map((subgroup) => [subgroup.id, subgroup.code])),
    [subgroups]
  )

  const rows: GridValidRowModel[] = subgroups

  const readCols = [
    useCodeCol('id', true, '/subgroups'),
    useNameCol(),
    useGroupCol(groups),
    useNumInGroupCol(),
    useTestsCountCol()
  ]

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      delete: rightsSet.has('DELETE_SUBGROUP')
        ? {
            prepareConfirmMessage: (rowId) => {
              return `удалить подгруппу тестов '${subgroupCodeForId.get(rowId) ?? ''}'?`
            },
            action: async (rowId) => {
              try {
                await serverConnector.deleteSubgroup({
                  id: rowId
                })
                notifier.showSuccess(
                  `подгруппа тестов '${subgroupCodeForId.get(rowId) ?? ''}' удалена`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, subgroupCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      ...readCols,
      ...(rightsSet.has('UPDATE_SUBGROUP') || rightsSet.has('DELETE_SUBGROUP')
        ? [actionsCol]
        : [])
    ],
    [readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(() => [] as (keyof Subgroup)[], [])

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_SUBGROUP')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedSubgroupCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_SUBGROUPS_IN_MESSAGES)
        .map((id) => subgroupCodeForId.get(id) ?? '')
    },
    [subgroupCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_SUBGROUP')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedSubgroupCodes = getDisplayedSubgroupCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedSubgroupCodes.length
              return `удалить подгрупп${count === 1 ? 'у' : 'ы'} тестов ${displayedSubgroupCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedSubgroupCodes = getDisplayedSubgroupCodes(rowIds)
              try {
                await serverConnector.deleteSubgroups({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedSubgroupCodes.length
                notifier.showSuccess(
                  `подгрупп${count === 1 ? 'а' : 'ы'} тестов${displayedSubgroupCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'а' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, rightsSet, getDisplayedSubgroupCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  return (
    <>
      <Grid
        localSaveKey="SUBGROUPS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateSubgroupFormDialog
        groups={groups}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateSubgroup={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
