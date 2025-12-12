// Project
import { convertMediaTypeToFileExtension } from '@common/formats'
import type { DbcSecondary } from '~/types'
import { downloadFileFromBlob } from '~/utilities/download-file'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateDbcFormDialog } from '~/components/forms/resources/create-dbc'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useDsefsCountCol,
  useNameCol,
  usePreparedCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_DBCS_IN_MESSAGES = 3

export interface DbcsGridProps {
  dbcs: DbcSecondary[]
  navigationMode?: boolean
}

export function DbcsGrid(props: DbcsGridProps) {
  const navigationMode = props.navigationMode ?? false
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const dbcCodeForId = React.useMemo(
    () => new Map(props.dbcs.map((dbc) => [dbc.id, dbc.code])),
    [props.dbcs]
  )

  const rows: GridValidRowModel[] = props.dbcs

  const readCols = [
    useCodeCol('id', true, '/dbcs'),
    useNameCol(),
    usePreparedCol(
      'FEMALE',
      'все необходимые конфигурации загружены',
      'не все необходимые конфигурации загружены'
    ),
    useDsefsCountCol()
  ]

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      export: {
        action: async (rowId) => {
          try {
            const config = await serverConnector.readDbcConfig({
              id: rowId
            })
            const code = dbcCodeForId.get(rowId) ?? ''
            const ext = convertMediaTypeToFileExtension(config.type) ?? ''
            const fileName = `${code}.${ext}`
            downloadFileFromBlob(config, fileName)
          } catch (error) {
            notifier.showError(error)
          }
        }
      },
      delete: rightsSet.has('DELETE_DBC')
        ? {
            prepareConfirmMessage: (rowId) =>
              `удалить базовую конфигурацию '${dbcCodeForId.get(rowId) ?? ''}'?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteDbc({
                  id: rowId
                })
                notifier.showSuccess(
                  `базовая конфигурация '${dbcCodeForId.get(rowId) ?? ''}' удалена`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, dbcCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [...readCols, actionsCol],
    [readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof DbcSecondary)[],
    []
  )

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_DBC')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedDbcCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_DBCS_IN_MESSAGES)
        .map((id) => dbcCodeForId.get(id) ?? '')
    },
    [dbcCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_DBC')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedDbcCodes = getDisplayedDbcCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedDbcCodes.length
              return `удалить базов${count === 1 ? 'ую' : 'ые'} конфигураци${count === 1 ? 'ю' : 'и'}${displayedDbcCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedDbcCodes = getDisplayedDbcCodes(rowIds)
              try {
                await serverConnector.deleteDbcs({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedDbcCodes.length
                notifier.showSuccess(
                  `базов${count === 1 ? 'ая' : 'ые'} конфигураци${count === 1 ? 'я' : 'и'}${displayedDbcCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'а' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, rightsSet, getDisplayedDbcCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  return (
    <>
      <Grid
        localSaveKey="DBCS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateDbcFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateDbc={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
