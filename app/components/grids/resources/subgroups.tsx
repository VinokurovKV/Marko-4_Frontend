// Project
import type { GroupPrimary, SubgroupSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
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
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_SUBGROUPS_IN_MESSAGES = 3

export interface SubgroupsGridProps {
  subgroups: SubgroupSecondary[]
  groups: GroupPrimary[] | null
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function SubgroupsGrid(props: SubgroupsGridProps) {
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

  const subgroupCodeForId = React.useMemo(
    () =>
      new Map(props.subgroups.map((subgroup) => [subgroup.id, subgroup.code])),
    [props.subgroups]
  )

  const rows: GridValidRowModel[] = props.subgroups

  const readCols = [
    useCodeCol('id', true, '/subgroups', navigationMode),
    useNameCol(),
    useGroupCol(props.groups),
    useNumInGroupCol(),
    useTestsCountCol()
  ]

  const navigationModeReadCols = React.useMemo(() => [readCols[0]], [readCols])

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      delete: rightsSet.has('DELETE_SUBGROUP')
        ? {
            prepareConfirmMessage: (rowId) => {
              return `удалить подгруппу тестов «${subgroupCodeForId.get(rowId) ?? ''}»?`
            },
            action: async (rowId) => {
              try {
                await serverConnector.deleteSubgroup({
                  id: rowId
                })
                notifier.showSuccess(
                  `подгруппа тестов «${subgroupCodeForId.get(rowId) ?? ''}» удалена`
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
    () =>
      navigationMode
        ? navigationModeReadCols
        : [
            ...readCols,
            ...(rightsSet.has('UPDATE_SUBGROUP') ||
            rightsSet.has('DELETE_SUBGROUP')
              ? [actionsCol]
              : [])
          ],
    [navigationMode, rightsSet, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof SubgroupSecondary)[],
    []
  )

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
              return `удалить подгрупп${count === 1 ? 'у' : 'ы'} тестов ${displayedSubgroupCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
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
                  `подгрупп${count === 1 ? 'а' : 'ы'} тестов${displayedSubgroupCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'а' : 'ы'}`
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

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/subgroups/${rowId}`
          : '/subgroups'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="SUBGROUPS"
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
        compactFooter={navigationMode}
      />
      <CreateSubgroupFormDialog
        groups={props.groups}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateSubgroup={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
