// Project
import type { ReadCommonTopologiesWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/common-topologies.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useCommonTopologiesSubscription } from '~/hooks/resources'
import { CreateCommonTopologyFormDialog } from '~/components/forms/resources/create-common-topology'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useNameCol,
  useNumCol,
  useTopologiesCountCol,
  useVertexesCountCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_COMMON_TOPOLOGIES_IN_MESSAGES = 3

type CommonTopology =
  DtoWithoutEnums<ReadCommonTopologiesWithUpToSecondaryPropsSuccessResultItemDto>

export interface CommonTopologiesGridProps {
  initialCommonTopologies: CommonTopology[]
  navigationMode?: boolean
}

export function CommonTopologiesGrid(props: CommonTopologiesGridProps) {
  const navigationMode = props.navigationMode ?? false
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const [commonTopologies, setCommonTopologies] = React.useState<
    CommonTopology[]
  >(props.initialCommonTopologies)

  useCommonTopologiesSubscription('UP_TO_SECONDARY_PROPS', setCommonTopologies)

  const commonTopologyCodeForId = React.useMemo(
    () =>
      new Map(
        commonTopologies.map((commonTopology) => [
          commonTopology.id,
          commonTopology.code
        ])
      ),
    [commonTopologies]
  )

  const rows: GridValidRowModel[] = commonTopologies

  const readCols = [
    useCodeCol('id', true, '/common-topologies'),
    useNameCol(),
    useNumCol(),
    useVertexesCountCol(),
    useTopologiesCountCol()
  ]

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      delete: rightsSet.has('DELETE_COMMON_TOPOLOGY')
        ? {
            prepareConfirmMessage: (rowId) =>
              `удалить общую топологию '${commonTopologyCodeForId.get(rowId) ?? ''}'?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteCommonTopology({
                  id: rowId
                })
                notifier.showSuccess(
                  `общая топология '${commonTopologyCodeForId.get(rowId) ?? ''}' удалена`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, commonTopologyCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      ...readCols,
      ...(rightsSet.has('UPDATE_COMMON_TOPOLOGY') ||
      rightsSet.has('DELETE_COMMON_TOPOLOGY')
        ? [actionsCol]
        : [])
    ],
    [rightsSet, readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof CommonTopology)[],
    []
  )

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_COMMON_TOPOLOGY')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedCommonTopologyCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_COMMON_TOPOLOGIES_IN_MESSAGES)
        .map((id) => commonTopologyCodeForId.get(id) ?? '')
    },
    [commonTopologyCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_COMMON_TOPOLOGY')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedCommonTopologyCodes =
                getDisplayedCommonTopologyCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedCommonTopologyCodes.length
              return `удалить общ${count === 1 ? 'ую' : 'ие'} топологи${count === 1 ? 'ю' : 'и'}${displayedCommonTopologyCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedCommonTopologyCodes =
                getDisplayedCommonTopologyCodes(rowIds)
              try {
                await serverConnector.deleteCommonTopologies({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedCommonTopologyCodes.length
                notifier.showSuccess(
                  `общ${count === 1 ? 'ая' : 'ие'} топологи${count === 1 ? 'я' : 'и'}${displayedCommonTopologyCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'а' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, rightsSet, getDisplayedCommonTopologyCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  return (
    <>
      <Grid
        localSaveKey="COMMON_TOPOLOGIES"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateCommonTopologyFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateCommonTopology={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
