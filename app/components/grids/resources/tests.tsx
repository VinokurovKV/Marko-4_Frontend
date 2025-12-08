// Project
import { convertMediaTypeToFileExtension } from '@common/formats'
import type { ReadTopologiesWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/topologies.dto'
import type { ReadDbcsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/dbcs.dto'
import type { ReadTestTemplatesWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/test-templates.dto'
import type { ReadTestsWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tests.dto'
import type { ReadSubgroupsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/subgroups.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { downloadFileFromBlob } from '~/utilities/download-file'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTopologiesSubscription,
  useDbcsSubscription,
  useTestTemplatesSubscription,
  useTestsSubscription,
  useSubgroupsSubscription
} from '~/hooks/resources'
import { CreateTestFormDialog } from '~/components/forms/resources/create-test'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useCoveragesCountCol,
  useDbcsCountCol,
  useDsefsCountCol,
  useNameCol,
  useNumInSubgroupCol,
  usePreparedCol,
  useSubgroupCol,
  useTestTemplateCol,
  useTopologyCol
  // useWithPassCriteriaCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_TESTS_IN_MESSAGES = 3

type Topology =
  DtoWithoutEnums<ReadTopologiesWithPrimaryPropsSuccessResultItemDto>
type Dbc = DtoWithoutEnums<ReadDbcsWithPrimaryPropsSuccessResultItemDto>
type TestTemplate =
  DtoWithoutEnums<ReadTestTemplatesWithPrimaryPropsSuccessResultItemDto>
type Test = DtoWithoutEnums<ReadTestsWithUpToSecondaryPropsSuccessResultItemDto>
type Subgroup =
  DtoWithoutEnums<ReadSubgroupsWithPrimaryPropsSuccessResultItemDto>

export interface TestsGridProps {
  initialTopologies: Topology[] | null
  initialDbcs: Dbc[] | null
  initialTestTemplates: TestTemplate[] | null
  initialTests: Test[]
  initialSubgroups: Subgroup[] | null
  navigationMode?: boolean
}

export function TestsGrid(props: TestsGridProps) {
  const navigationMode = props.navigationMode ?? false
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const [topologies, setTopologies] = React.useState<Topology[] | null>(
    props.initialTopologies
  )
  const [dbcs, setDbcs] = React.useState<Dbc[] | null>(props.initialDbcs)
  const [testTemplates, setTestTemplates] = React.useState<
    TestTemplate[] | null
  >(props.initialTestTemplates)
  const [tests, setTests] = React.useState<Test[]>(props.initialTests)
  const [subgroups, setSubgroups] = React.useState<Subgroup[] | null>(
    props.initialSubgroups
  )

  useTopologiesSubscription('PRIMARY_PROPS', setTopologies)
  useDbcsSubscription('PRIMARY_PROPS', setDbcs)
  useTestTemplatesSubscription('PRIMARY_PROPS', setTestTemplates)
  useTestsSubscription('UP_TO_SECONDARY_PROPS', setTests)
  useSubgroupsSubscription('PRIMARY_PROPS', setSubgroups)

  const testCodeForId = React.useMemo(
    () => new Map(tests.map((test) => [test.id, test.code])),
    [tests]
  )

  const rows: GridValidRowModel[] = tests

  const readCols = [
    useCodeCol('id', true, '/tests'),
    useNameCol(),
    useSubgroupCol(subgroups),
    useNumInSubgroupCol(),
    useCoveragesCountCol(),
    useTopologyCol(topologies),
    useTestTemplateCol(testTemplates),
    usePreparedCol(
      'MALE',
      'все необходимые конфигурации загружены',
      'не все необходимые конфигурации загружены'
    ),
    // useWithPassCriteriaCol(),
    useDbcsCountCol(),
    useDsefsCountCol()
  ]

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
                  `тест '${testCodeForId.get(rowId) ?? ''}' удален`
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
    () => [...readCols, actionsCol],
    [readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => ['dbcsCount', 'dsefsCount'] as (keyof Test)[],
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
              return `удалить тест${count === 1 ? '' : 'ы'}${displayedTestCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
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
                  `тест${count === 1 ? '' : 'ы'}${displayedTestCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? '' : 'ы'}`
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

  return (
    <>
      <Grid
        localSaveKey="TESTS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateTestFormDialog
        topologies={topologies}
        dbcs={dbcs}
        testTemplates={testTemplates}
        subgroups={subgroups}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateTest={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
