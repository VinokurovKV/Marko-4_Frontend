// Project
import { convertMediaTypeToFileExtension } from '@common/formats'
import type { ReadDocumentsWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/documents.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { downloadFileFromBlob } from '~/utilities/download-file'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useDocumentsSubscription } from '~/hooks/resources'
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
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_DOCUMENTS_IN_MESSAGES = 3

type Document =
  DtoWithoutEnums<ReadDocumentsWithUpToSecondaryPropsSuccessResultItemDto>

export interface DocumentsGridProps {
  initialDocuments: Document[]
  navigationMode?: boolean
}

export function DocumentsGrid(props: DocumentsGridProps) {
  const navigationMode = props.navigationMode ?? false
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const [documents, setDocuments] = React.useState<Document[]>(
    props.initialDocuments
  )

  useDocumentsSubscription('UP_TO_SECONDARY_PROPS', setDocuments)

  const documentCodeForId = React.useMemo(
    () => new Map(documents.map((document) => [document.id, document.code])),
    [documents]
  )

  const rows: GridValidRowModel[] = documents

  const readCols = [
    useCodeCol('id', true, '/documents'),
    useNameCol(),
    useDocumentTypeCol(),
    useFormatCol(['PDF']),
    useFragmentsCountCol(),
    usePublicVersionCol(),
    useDocumentDateCol(),
    useUrlCol()
  ]

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
              `удалить документ '${documentCodeForId.get(rowId) ?? ''}'?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteDocument({
                  id: rowId
                })
                notifier.showSuccess(
                  `документ '${documentCodeForId.get(rowId) ?? ''}' удален`
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
    () => [...readCols, actionsCol],
    [readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => ['publicVersion', 'date'] as (keyof Document)[],
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
              return `удалить документ${count === 1 ? '' : 'ы'}${displayedDocumentCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
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
                  `документ${count === 1 ? '' : 'ы'}${displayedDocumentCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? '' : 'ы'}`
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

  return (
    <>
      <Grid
        localSaveKey="DOCUMENTS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
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
