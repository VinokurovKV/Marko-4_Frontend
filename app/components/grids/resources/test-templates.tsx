// Project
import { convertMediaTypeToFileExtension } from '@common/formats'
import type { ReadTestTemplatesWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/test-templates.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { downloadFileFromBlob } from '~/utilities/download-file'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useTestTemplatesSubscription } from '~/hooks/resources'
import { CreateTestTemplateFormDialog } from '~/components/forms/resources/create-test-template'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useNameCol,
  usePreparedCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_TEST_TEMPLATES_IN_MESSAGES = 3

type TestTemplate =
  DtoWithoutEnums<ReadTestTemplatesWithUpToSecondaryPropsSuccessResultItemDto>

export interface TestTemplatesGridProps {
  initialTestTemplates: TestTemplate[]
}

export function TestTemplatesGrid(props: TestTemplatesGridProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet =
    meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const [testTemplates, setTestTemplates] = React.useState<TestTemplate[]>(
    props.initialTestTemplates
  )

  useTestTemplatesSubscription('UP_TO_SECONDARY_PROPS', setTestTemplates)

  const testTemplateCodeForId = React.useMemo(
    () =>
      new Map(
        testTemplates.map((testTemplate) => [
          testTemplate.id,
          testTemplate.code
        ])
      ),
    [testTemplates]
  )

  const rows: GridValidRowModel[] = testTemplates

  const readCols = [
    useCodeCol('id', true, '/test-templates'),
    useNameCol(),
    usePreparedCol('MALE', undefined, 'конфигурация не загружена')
  ]

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      export: {
        action: async (rowId) => {
          try {
            const config = await serverConnector.readTestTemplateConfig({
              id: rowId
            })
            const code = testTemplateCodeForId.get(rowId) ?? ''
            const ext = convertMediaTypeToFileExtension(config.type) ?? ''
            const fileName = `${code}-config.${ext}`
            downloadFileFromBlob(config, fileName)
          } catch (error) {
            notifier.showError(error)
          }
        }
      },
      delete: rightsSet.has('DELETE_TEST_TEMPLATE')
        ? {
            prepareConfirmMessage: (rowId) =>
              `удалить шаблон теста '${testTemplateCodeForId.get(rowId) ?? ''}'?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteTestTemplate({
                  id: rowId
                })
                notifier.showSuccess(
                  `шаблон теста '${testTemplateCodeForId.get(rowId) ?? ''}' удален`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, testTemplateCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [...readCols, actionsCol],
    [readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof TestTemplate)[],
    []
  )

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_TEST_TEMPLATE')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedTestTemplateCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_TEST_TEMPLATES_IN_MESSAGES)
        .map((id) => testTemplateCodeForId.get(id) ?? '')
    },
    [testTemplateCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_TEST_TEMPLATE')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedTestTemplateCodes =
                getDisplayedTestTemplateCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedTestTemplateCodes.length
              return `удалить шаблон${count === 1 ? '' : 'ы'} тест${count === 1 ? 'а' : 'ов'}${displayedTestTemplateCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedTestTemplateCodes =
                getDisplayedTestTemplateCodes(rowIds)
              try {
                await serverConnector.deleteTestTemplates({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedTestTemplateCodes.length
                notifier.showSuccess(
                  `шаблон${count === 1 ? '' : 'ы'} тест${count === 1 ? 'а' : 'ов'}${displayedTestTemplateCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? '' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, rightsSet, getDisplayedTestTemplateCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  return (
    <>
      <Grid
        localSaveKey="TEST_TEMPLATES"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateTestTemplateFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateTestTemplate={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
