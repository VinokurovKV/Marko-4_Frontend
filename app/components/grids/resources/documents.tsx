// Project
import { convertFileFormatToExtension } from '@common/formats'
import type { ReadTagsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tags.dto'
import type { ReadDocumentsWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/documents.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { downloadFileFromBlob } from '~/utilities/download-file'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateDocumentFormDialog } from '~/components/forms/resources/create-document'
import { type GridProps, Grid } from '../grid'
import {
  useCodeCol,
  useDocumentTypeCol,
  useNameCol,
  useFormatCol,
  useFragmentsCountCol,
  usePublicVersionCol,
  useDocumentDateCol,
  useUrlCol,
  type ActionsColProps,
  useActionsCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_DOCUMENTS_IN_MESSAGES = 3

type Tag = DtoWithoutEnums<ReadTagsWithPrimaryPropsSuccessResultItemDto>
type Document =
  DtoWithoutEnums<ReadDocumentsWithUpToSecondaryPropsSuccessResultItemDto>

export interface DocumentsGridProps {
  initialTags: Tag[] | null
  initialDocuments: Document[]
}

export function DocumentsGrid(props: DocumentsGridProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet =
    meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const [tags, setTags] = React.useState<Tag[] | null>(props.initialTags)
  const [documents, setDocuments] = React.useState<Document[]>(
    props.initialDocuments
  )

  const documentCodeForId = React.useMemo(
    () => new Map(documents.map((document) => [document.id, document.code])),
    [documents]
  )

  const documentFormatForId = React.useMemo(
    () => new Map(documents.map((document) => [document.id, document.format])),
    [documents]
  )

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'TAG'
      },
      (data) => {
        void (async () => {
          const scope = data.updateScope
          if (scope.primaryProps) {
            try {
              const tags = await serverConnector.readTags({
                scope: 'PRIMARY_PROPS'
              })
              setTags(tags)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список тегов'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setTags])

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'DOCUMENT'
      },
      (data) => {
        void (async () => {
          const scope = data.updateScope
          if (scope.primaryProps || scope.secondaryProps) {
            try {
              const documents = await serverConnector.readDocuments({
                scope: 'UP_TO_SECONDARY_PROPS'
              })
              setDocuments(documents)
            } catch {
              notifier.showWarning(
                'не удалось загрузить актуальный список документов'
              )
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [setDocuments])

  const rows: GridValidRowModel[] = documents

  const readCols = [
    useCodeCol('id', true, '/documents'),
    useDocumentTypeCol(),
    useNameCol(),
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
            const format = documentFormatForId.get(rowId)
            const ext =
              format !== undefined ? convertFileFormatToExtension(format) : ''
            const fileName = `${code}.${ext}`
            downloadFileFromBlob(config, fileName)
          } catch (error) {
            notifier.showError(error)
          }
        }
      },
      delete: {
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
    }),
    [documentCodeForId, documentFormatForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      ...readCols,
      ...(rightsSet.has('UPDATE_DOCUMENT') || rightsSet.has('DELETE_DOCUMENT')
        ? [actionsCol]
        : [])
    ],
    [rightsSet, readCols, actionsCol]
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
    [rightsSet, getDisplayedDocumentCodes]
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
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateDocumentFormDialog
        tags={tags}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateDocument={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
