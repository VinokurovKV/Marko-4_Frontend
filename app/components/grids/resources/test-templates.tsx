// Project
import { convertMediaTypeToFileExtension } from '@common/formats'
import type { TestTemplateSecondary } from '~/types'
import { downloadFileFromBlob } from '~/utilities'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateTestTemplateFormDialog } from '~/components/forms/resources/create-test-template'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useNameCol,
  usePreparedCol
} from '../cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_TEST_TEMPLATES_IN_MESSAGES = 3

export interface TestTemplatesGridProps {
  testTemplates: TestTemplateSecondary[]
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function TestTemplatesGrid(props: TestTemplatesGridProps) {
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

  const testTemplateCodeForId = React.useMemo(
    () =>
      new Map(
        props.testTemplates.map((testTemplate) => [
          testTemplate.id,
          testTemplate.code
        ])
      ),
    [props.testTemplates]
  )

  const rows: GridValidRowModel[] = props.testTemplates

  const readCols = [
    useCodeCol('id', true, '/test-templates', navigationMode),
    useNameCol(),
    usePreparedCol(
      'MALE',
      'конфигурация загружена',
      'конфигурация не загружена'
    )
  ]

  const navigationModeReadCols = React.useMemo(() => [readCols[0]], [readCols])

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
                  `шаблон теста «${testTemplateCodeForId.get(rowId) ?? ''}» удален`
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
    () => (navigationMode ? navigationModeReadCols : [...readCols, actionsCol]),
    [navigationMode, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof TestTemplateSecondary)[],
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
              return `удалить шаблон${count === 1 ? '' : 'ы'} тест${count === 1 ? 'а' : 'ов'}${displayedTestTemplateCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
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
                  `шаблон${count === 1 ? '' : 'ы'} тест${count === 1 ? 'а' : 'ов'}${displayedTestTemplateCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? '' : 'ы'}`
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

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/test-templates/${rowId}`
          : '/test-templates'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="TEST_TEMPLATES"
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
      <CreateTestTemplateFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateTestTemplate={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
