// Project
import type { CommonTopologySecondary, CommonTopologyTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateCommonTopologyFormDialog } from '~/components/forms/resources/create-common-topology'
import { UpdateCommonTopologyFormDialog } from '~/components/forms/resources/update-common-topology'
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
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_COMMON_TOPOLOGIES_IN_MESSAGES = 3

export interface CommonTopologiesGridProps {
  commonTopologies: CommonTopologySecondary[]
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function CommonTopologiesGrid(props: CommonTopologiesGridProps) {
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
  const [updatedCommonTopologyId, setUpdatedCommonTopologyId] = React.useState<
    number | null
  >(null)
  const [initialUpdatedCommonTopology, setInitialUpdatedCommonTopology] =
    React.useState<CommonTopologyTertiary | null>(null)

  const commonTopologyCodeForId = React.useMemo(
    () =>
      new Map(
        props.commonTopologies.map((commonTopology) => [
          commonTopology.id,
          commonTopology.code
        ])
      ),
    [props.commonTopologies]
  )

  const rows: GridValidRowModel[] = props.commonTopologies

  const readCols = [
    useCodeCol('id', true, '/common-topologies', navigationMode),
    useNameCol(),
    useNumCol(),
    useVertexesCountCol(),
    useTopologiesCountCol()
  ]

  const navigationModeReadCols = React.useMemo(() => [readCols[0]], [readCols])

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      update: rightsSet.has('UPDATE_COMMON_TOPOLOGY')
        ? {
            action: async (rowId) => {
              try {
                const initialCommonTopology =
                  await serverConnector.readCommonTopology(
                    {
                      id: rowId
                    },
                    {
                      scope: 'UP_TO_TERTIARY_PROPS'
                    }
                  )
                setUpdatedCommonTopologyId(rowId)
                setInitialUpdatedCommonTopology(initialCommonTopology)
              } catch {
                notifier.showWarning(
                  `не удалось загрузить общую топологию с идентификатором ${rowId}`
                )
              }
            }
          }
        : undefined,
      delete: rightsSet.has('DELETE_COMMON_TOPOLOGY')
        ? {
            prepareConfirmMessage: (rowId) =>
              `удалить общую топологию «${commonTopologyCodeForId.get(rowId) ?? ''}»?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteCommonTopology({
                  id: rowId
                })
                notifier.showSuccess(
                  `общая топология «${commonTopologyCodeForId.get(rowId) ?? ''}» удалена`
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
      ...(navigationMode ? navigationModeReadCols : readCols),
      ...(rightsSet.has('UPDATE_COMMON_TOPOLOGY') ||
      rightsSet.has('DELETE_COMMON_TOPOLOGY')
        ? [actionsCol]
        : [])
    ],
    [navigationMode, rightsSet, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof CommonTopologySecondary)[],
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
                  `общ${count === 1 ? 'ая' : 'ие'} топологи${count === 1 ? 'я' : 'и'}${displayedCommonTopologyCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'а' : 'ы'}`
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

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedCommonTopologyId(null)
  }, [setUpdatedCommonTopologyId])

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/common-topologies/${rowId}`
          : '/common-topologies'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="COMMON_TOPOLOGIES"
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
      <CreateCommonTopologyFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateCommonTopology={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
      <UpdateCommonTopologyFormDialog
        key={updatedCommonTopologyId}
        commonTopologyId={updatedCommonTopologyId}
        setCommonTopologyId={setUpdatedCommonTopologyId}
        initialCommonTopology={initialUpdatedCommonTopology}
        onSuccessUpdateCommonTopology={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
