// Project
import type { ReadCommonTopologiesWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/common-topologies.dto'
import type { ReadTopologiesWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/topologies.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useCommonTopologiesSubscription,
  useTopologiesSubscription
} from '~/hooks/resources'
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
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_TOPOLOGIES_IN_MESSAGES = 3

type CommonTopology =
  DtoWithoutEnums<ReadCommonTopologiesWithPrimaryPropsSuccessResultItemDto>
type Topology =
  DtoWithoutEnums<ReadTopologiesWithUpToSecondaryPropsSuccessResultItemDto>

export interface TopologiesGridProps {
  initialCommonTopologies: CommonTopology[] | null
  initialTopologies: Topology[]
  navigationMode?: boolean
}

export function TopologiesGrid(props: TopologiesGridProps) {
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
    CommonTopology[] | null
  >(props.initialCommonTopologies)
  const [topologies, setTopologies] = React.useState<Topology[]>(
    props.initialTopologies
  )

  useCommonTopologiesSubscription('PRIMARY_PROPS', setCommonTopologies)
  useTopologiesSubscription('UP_TO_SECONDARY_PROPS', setTopologies)

  const topologyCodeForId = React.useMemo(
    () => new Map(topologies.map((topology) => [topology.id, topology.code])),
    [topologies]
  )

  const rows: GridValidRowModel[] = topologies

  const readCols = [
    useCodeCol('id', true, '/topologies'),
    useNameCol(),
    useCommonTopologyCol(commonTopologies),
    useNumInCommonTopologyCol(),
    useVertexesCountCol()
  ]

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
    () => [
      ...readCols,
      ...(rightsSet.has('UPDATE_TOPOLOGY') || rightsSet.has('DELETE_TOPOLOGY')
        ? [actionsCol]
        : [])
    ],
    [rightsSet, readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(() => [] as (keyof Topology)[], [])

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

  return (
    <>
      <Grid
        localSaveKey="TOPOLOGIES"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateTopologyFormDialog
        commonTopologies={commonTopologies}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateTopology={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
