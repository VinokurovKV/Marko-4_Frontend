// Project
import { convertMediaTypeToFileExtension } from '@common/formats'
import type {
  TopologyPrimary,
  DbcPrimary,
  TestTemplatePrimary,
  TestSecondary,
  TestTertiary,
  SubgroupPrimary
} from '~/types'
import { downloadFileFromBlob } from '~/utilities'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateTestFormDialog } from '~/components/forms/resources/create-test'
import { UpdateTestFormDialog } from '~/components/forms/resources/update-test'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useDbcsCountCol,
  useDsefsCountCol,
  useNameCol,
  useNumInSubgroupCol,
  usePreparedCol,
  useCoveredRequirementsCountCol,
  useSubgroupCol,
  useTestTemplateCol,
  useTopologyCol
  // useWithPassCriteriaCol
} from '../cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_TESTS_IN_MESSAGES = 3

export interface TestsGridProps {
  topologies: TopologyPrimary[] | null
  dbcs: DbcPrimary[] | null
  testTemplates: TestTemplatePrimary[] | null
  tests: TestSecondary[]
  subgroups: SubgroupPrimary[] | null
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function TestsGrid(props: TestsGridProps) {
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
  const [updatedTestId, setUpdatedTestId] = React.useState<number | null>(null)
  const [initialUpdatedTest, setInitialUpdatedTest] =
    React.useState<TestTertiary | null>(null)

  const testCodeForId = React.useMemo(
    () => new Map(props.tests.map((test) => [test.id, test.code])),
    [props.tests]
  )

  const rows: GridValidRowModel[] = props.tests

  const readCols = [
    useCodeCol('id', true, '/tests', navigationMode),
    useNameCol(),
    useSubgroupCol(props.subgroups),
    useNumInSubgroupCol(),
    useCoveredRequirementsCountCol(),
    useTopologyCol(props.topologies),
    useTestTemplateCol(props.testTemplates),
    usePreparedCol(
      'MALE',
      'все необходимые конфигурации загружены',
      'не все необходимые конфигурации загружены'
    ),
    // useWithPassCriteriaCol(),
    useDbcsCountCol(),
    useDsefsCountCol()
  ]

  const navigationModeReadCols = React.useMemo(() => [readCols[0]], [readCols])

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      exportMenuItems: [
        {
          title: 'Скачать конфигурацию',
          action: async (rowId) => {
            try {
              const config = await serverConnector.readTestConfig({
                id: rowId
              })
              const code = testCodeForId.get(rowId) ?? ''
              const ext = convertMediaTypeToFileExtension(config.type) ?? ''
              const fileName = `${code}-config.${ext}`
              downloadFileFromBlob(config, fileName)
            } catch (error) {
              notifier.showError(error)
            }
          }
        }
      ],
      update: rightsSet.has('UPDATE_TEST')
        ? {
            action: async (rowId) => {
              try {
                const initialTest = await serverConnector.readTest(
                  {
                    id: rowId
                  },
                  {
                    scope: 'UP_TO_TERTIARY_PROPS'
                  }
                )
                setUpdatedTestId(rowId)
                setInitialUpdatedTest(initialTest)
              } catch {
                notifier.showWarning(
                  `не удалось загрузить тест с идентификатором ${rowId}`
                )
              }
            }
          }
        : undefined,
      delete: rightsSet.has('DELETE_TEST')
        ? {
            prepareConfirmMessage: (rowId) =>
              `удалить тест '${testCodeForId.get(rowId) ?? ''}'?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteTest({
                  id: rowId
                })
                notifier.showSuccess(
                  `тест «${testCodeForId.get(rowId) ?? ''}» удален`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, testCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [...(navigationMode ? navigationModeReadCols : readCols), actionsCol],
    [navigationMode, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () =>
      ['numInSubgroup', 'dbcsCount', 'dsefsCount'] as (keyof TestSecondary)[],
    []
  )

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_TEST')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedTestCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_TESTS_IN_MESSAGES)
        .map((id) => testCodeForId.get(id) ?? '')
    },
    [testCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_TEST')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedTestCodes = getDisplayedTestCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedTestCodes.length
              return `удалить тест${count === 1 ? '' : 'ы'}${displayedTestCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedTestCodes = getDisplayedTestCodes(rowIds)
              try {
                await serverConnector.deleteTests({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedTestCodes.length
                notifier.showSuccess(
                  `тест${count === 1 ? '' : 'ы'}${displayedTestCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? '' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, rightsSet, getDisplayedTestCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedTestId(null)
  }, [setUpdatedTestId])

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/tests/${rowId}`
          : '/tests'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="TESTS"
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
      <CreateTestFormDialog
        topologies={props.topologies}
        dbcs={props.dbcs}
        testTemplates={props.testTemplates}
        subgroups={props.subgroups}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateTest={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
      <UpdateTestFormDialog
        key={updatedTestId}
        topologies={props.topologies}
        dbcs={props.dbcs}
        testTemplates={props.testTemplates}
        subgroups={props.subgroups}
        testId={updatedTestId}
        setTestId={setUpdatedTestId}
        initialTest={initialUpdatedTest}
        onSuccessUpdateTest={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
