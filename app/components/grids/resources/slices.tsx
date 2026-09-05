// Project
import type { SliceSecondary, SliceTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateSliceFormDialog } from '~/components/forms/resources/create-slice'
import { UpdateSliceFormDialog } from '~/components/forms/resources/update-slice'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useNameCol
} from '../cols'
// React
import * as React from 'react'
// React router
import { useNavigate } from 'react-router'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_SLICES_IN_MESSAGES = 3

export interface SlicesGridProps {
  slices: SliceSecondary[]
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
  onSlicesChange?: () => void
}

export function SlicesGrid(props: SlicesGridProps) {
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
  const [updatedSliceId, setUpdatedSliceId] = React.useState<number | null>(
    null
  )
  const [initialUpdatedSlice, setInitialUpdatedSlice] =
    React.useState<SliceTertiary | null>(null)

  const sliceCodeForId = React.useMemo(
    () => new Map(props.slices.map((slice) => [slice.id, slice.code])),
    [props.slices]
  )

  const rows: GridValidRowModel[] = props.slices

  const readCols = [
    useCodeCol('id', true, '/slices', navigationMode),
    useNameCol()
  ]

  const navigationModeReadCols = React.useMemo(() => [readCols[0]], [readCols])

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      update: rightsSet.has('UPDATE_SLICE')
        ? {
            action: async (rowId) => {
              try {
                const initialSlice = await serverConnector.readSlice(
                  {
                    id: rowId
                  },
                  {
                    scope: 'UP_TO_TERTIARY_PROPS'
                  }
                )
                setUpdatedSliceId(rowId)
                setInitialUpdatedSlice(initialSlice)
              } catch {
                notifier.showWarning(
                  `не удалось загрузить срез заданий с идентификатором ${rowId}`
                )
              }
            }
          }
        : undefined,
      delete: rightsSet.has('DELETE_SLICE')
        ? {
            prepareConfirmMessage: (rowId) =>
              `удалить срез заданий «${sliceCodeForId.get(rowId) ?? ''}»?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteSlice({
                  id: rowId
                })
                notifier.showSuccess(
                  `срез заданий «${sliceCodeForId.get(rowId) ?? ''}» удален`
                )
                props.onSlicesChange?.()
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, props.onSlicesChange, rightsSet, sliceCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      ...(navigationMode ? navigationModeReadCols : readCols),
      ...(navigationMode === false &&
      (rightsSet.has('UPDATE_SLICE') || rightsSet.has('DELETE_SLICE'))
        ? [actionsCol]
        : [])
    ],
    [navigationMode, rightsSet, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof SliceSecondary)[],
    []
  )

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_SLICE')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedSliceCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_SLICES_IN_MESSAGES)
        .map((id) => sliceCodeForId.get(id) ?? '')
    },
    [sliceCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_SLICE')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedSliceCodes = getDisplayedSliceCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedSliceCodes.length
              return `удалить срез${count === 1 ? '' : 'ы'} заданий${displayedSliceCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedSliceCodes = getDisplayedSliceCodes(rowIds)
              try {
                await serverConnector.deleteSlices({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedSliceCodes.length
                notifier.showSuccess(
                  `срез${count === 1 ? '' : 'ы'} заданий${displayedSliceCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? '' : 'ы'}`
                )
                props.onSlicesChange?.()
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, props.onSlicesChange, rightsSet, getDisplayedSliceCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  const handleSuccessCreateSlice = React.useCallback(() => {
    cancelCreateForm()
    props.onSlicesChange?.()
  }, [cancelCreateForm, props.onSlicesChange])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedSliceId(null)
  }, [setUpdatedSliceId])

  const handleSuccessUpdateSlice = React.useCallback(() => {
    cancelUpdateForm()
    props.onSlicesChange?.()
  }, [cancelUpdateForm, props.onSlicesChange])

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/slices/${rowId}`
          : '/slices'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="SLICES"
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
      <CreateSliceFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateSlice={handleSuccessCreateSlice}
        onCancelClick={cancelCreateForm}
      />
      <UpdateSliceFormDialog
        key={updatedSliceId}
        sliceId={updatedSliceId}
        setSliceId={setUpdatedSliceId}
        initialSlice={initialUpdatedSlice}
        onSuccessUpdateSlice={handleSuccessUpdateSlice}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
