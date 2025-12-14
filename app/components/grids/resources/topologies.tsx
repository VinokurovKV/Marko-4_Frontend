// Project
import type { CommonTopologyPrimary, TopologySecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateTopologyFormDialog } from '~/components/forms/resources/create-topology'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useCommonTopologyCol,
  useNameCol,
  useNumInCommonTopologyCol,
  useVertexesCountCol
} from '../cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_TOPOLOGIES_IN_MESSAGES = 3

export interface TopologiesGridProps {
  commonTopologies: CommonTopologyPrimary[] | null
  topologies: TopologySecondary[]
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function TopologiesGrid(props: TopologiesGridProps) {
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

  const topologyCodeForId = React.useMemo(
    () =>
      new Map(props.topologies.map((topology) => [topology.id, topology.code])),
    [props.topologies]
  )

  const rows: GridValidRowModel[] = props.topologies

  const readCols = [
    useCodeCol('id', true, '/topologies', navigationMode),
    useNameCol(),
    useCommonTopologyCol(props.commonTopologies),
    useNumInCommonTopologyCol(),
    useVertexesCountCol()
  ]

  const navigationModeReadCols = React.useMemo(() => [readCols[0]], [readCols])

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      delete: rightsSet.has('DELETE_TOPOLOGY')
        ? {
            prepareConfirmMessage: (rowId) => {
              return `удалить топологию '${topologyCodeForId.get(rowId) ?? ''}'?`
            },
            action: async (rowId) => {
              try {
                await serverConnector.deleteTopology({
                  id: rowId
                })
                notifier.showSuccess(
                  `топология '${topologyCodeForId.get(rowId) ?? ''}' удалена`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, topologyCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () =>
      navigationMode
        ? navigationModeReadCols
        : [
            ...readCols,
            ...(rightsSet.has('UPDATE_TOPOLOGY') ||
            rightsSet.has('DELETE_TOPOLOGY')
              ? [actionsCol]
              : [])
          ],
    [navigationMode, rightsSet, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof TopologySecondary)[],
    []
  )

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_TOPOLOGY')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedTopologyCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_TOPOLOGIES_IN_MESSAGES)
        .map((id) => topologyCodeForId.get(id) ?? '')
    },
    [topologyCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_TOPOLOGY')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedTopologyCodes = getDisplayedTopologyCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedTopologyCodes.length
              return `удалить топологи${count === 1 ? 'ю' : 'и'}${displayedTopologyCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedTopologyCodes = getDisplayedTopologyCodes(rowIds)
              try {
                await serverConnector.deleteTopologies({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedTopologyCodes.length
                notifier.showSuccess(
                  `топологи${count === 1 ? 'я' : 'и'}${displayedTopologyCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'а' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, rightsSet, getDisplayedTopologyCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/topologies/${rowId}`
          : '/topologies'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="TOPOLOGIES"
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
      <CreateTopologyFormDialog
        commonTopologies={props.commonTopologies}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateTopology={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
