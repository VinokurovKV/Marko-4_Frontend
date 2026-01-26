// Project
import { convertMediaTypeToFileExtension } from '@common/formats'
import type { DocumentSecondary } from '~/types'
import { downloadFileFromBlob } from '~/utilities'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateDocumentFormDialog } from '~/components/forms/resources/create-document'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useDocumentDateCol,
  useDocumentTypeCol,
  useFormatCol,
  useFragmentsCountCol,
  useNameCol,
  usePublicVersionCol,
  useUrlCol
} from '../cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_DOCUMENTS_IN_MESSAGES = 3

export interface DocumentsGridProps {
  documents: DocumentSecondary[]
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function DocumentsGrid(props: DocumentsGridProps) {
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

  const documentCodeForId = React.useMemo(
    () =>
      new Map(props.documents.map((document) => [document.id, document.code])),
    [props.documents]
  )

  const rows: GridValidRowModel[] = props.documents

  const readCols = [
    useCodeCol('id', true, '/documents', navigationMode),
    useNameCol(),
    useDocumentTypeCol(),
    useFormatCol(['PDF']),
    useFragmentsCountCol(),
    usePublicVersionCol(),
    useDocumentDateCol(),
    useUrlCol()
  ]

  const navigationModeReadCols = React.useMemo(() => [readCols[0]], [readCols])

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      export: {
        action: async (rowId) => {
          try {
            const config = await serverConnector.readDocumentConfig({
              id: rowId
            })
            const code = documentCodeForId.get(rowId) ?? ''
            const ext = convertMediaTypeToFileExtension(config.type) ?? ''
            const fileName = `${code}.${ext}`
            downloadFileFromBlob(config, fileName)
          } catch (error) {
            notifier.showError(error)
          }
        }
      },
      delete: rightsSet.has('DELETE_DOCUMENT')
        ? {
            prepareConfirmMessage: (rowId) =>
              `удалить документ «${documentCodeForId.get(rowId) ?? ''}»?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteDocument({
                  id: rowId
                })
                notifier.showSuccess(
                  `документ «${documentCodeForId.get(rowId) ?? ''}» удален`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, documentCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => (navigationMode ? navigationModeReadCols : [...readCols, actionsCol]),
    [navigationMode, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () =>
      [
        /*'publicVersion', 'date'*/
      ] as (keyof DocumentSecondary)[],
    []
  )

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_DOCUMENT')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedDocumentCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_DOCUMENTS_IN_MESSAGES)
        .map((id) => documentCodeForId.get(id) ?? '')
    },
    [documentCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_DOCUMENT')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedDocumentCodes = getDisplayedDocumentCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedDocumentCodes.length
              return `удалить документ${count === 1 ? '' : 'ы'}${displayedDocumentCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedDocumentCodes = getDisplayedDocumentCodes(rowIds)
              try {
                await serverConnector.deleteDocuments({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedDocumentCodes.length
                notifier.showSuccess(
                  `документ${count === 1 ? '' : 'ы'}${displayedDocumentCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? '' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, rightsSet, getDisplayedDocumentCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/documents/${rowId}`
          : '/documents'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="DOCUMENTS"
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
      <CreateDocumentFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateDocument={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
