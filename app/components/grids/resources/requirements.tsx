// Project
import type { RequirementSecondary, TestPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateRequirementFormDialog } from '~/components/forms/resources/create-requirement'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useChildRequirementsCountCol,
  useCodeCol,
  useFragmentsCountCol,
  useNameCol,
  useParentRequirementsCountCol,
  useRequirementModifierCol,
  useRequirementOriginCol,
  useRequirementRateCol,
  useTestCol
} from '../cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_REQUIREMENTS_IN_MESSAGES = 3

export interface RequirementsGridProps {
  requirements: RequirementSecondary[]
  tests: TestPrimary[] | null
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function RequirementsGrid(props: RequirementsGridProps) {
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

  const requirementCodeForId = React.useMemo(
    () =>
      new Map(
        props.requirements.map((requirement) => [
          requirement.id,
          requirement.code
        ])
      ),
    [props.requirements]
  )

  const rows: GridValidRowModel[] = props.requirements

  const readCols = [
    useCodeCol('id', true, '/requirements', navigationMode),
    useNameCol(),
    useRequirementModifierCol(),
    useRequirementOriginCol(),
    useRequirementRateCol(),
    useFragmentsCountCol(),
    useParentRequirementsCountCol(),
    useChildRequirementsCountCol(),
    useTestCol(props.tests)
  ]

  const navigationModeReadCols = React.useMemo(() => [readCols[0]], [readCols])

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      delete: rightsSet.has('DELETE_REQUIREMENT')
        ? {
            prepareConfirmMessage: (rowId) =>
              `удалить требование '${requirementCodeForId.get(rowId) ?? ''}'?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteRequirement({
                  id: rowId
                })
                notifier.showSuccess(
                  `требование '${requirementCodeForId.get(rowId) ?? ''}' удалено`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, requirementCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () =>
      navigationMode
        ? navigationModeReadCols
        : [
            ...readCols,
            ...(rightsSet.has('UPDATE_REQUIREMENT') ||
            rightsSet.has('DELETE_REQUIREMENT')
              ? [actionsCol]
              : [])
          ],
    [navigationMode, rightsSet, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => ['fragmentsCount'] as (keyof RequirementSecondary)[],
    []
  )

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_REQUIREMENT')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedRequirementCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_REQUIREMENTS_IN_MESSAGES)
        .map((id) => requirementCodeForId.get(id) ?? '')
    },
    [requirementCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_REQUIREMENT')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedRequirementCodes =
                getDisplayedRequirementCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedRequirementCodes.length
              return `удалить требовани${count === 1 ? 'е' : 'я'}${displayedRequirementCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedRequirementCodes =
                getDisplayedRequirementCodes(rowIds)
              try {
                await serverConnector.deleteRequirements({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedRequirementCodes.length
                notifier.showSuccess(
                  `требовани${count === 1 ? 'е' : 'я'}${displayedRequirementCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'о' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, rightsSet, getDisplayedRequirementCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  // const handleChangeModeClick = React.useCallback(() => {
  //   void navigate(navigationMode ? '/requirements' : '/requirements/hierarchy')
  // }, [navigationMode, navigate])

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/requirements/${rowId}`
          : '/requirements'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="REQUIREMENTS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
        selectedRowId={
          navigationMode ? props.navigationModeSelectedRowId : undefined
        }
        navigationModeOnRowClick={handleNavigationModeRowClick}
        // onChangeModeClick={handleChangeModeClick}
        create={createProps}
        deleteMany={deleteManyProps}
        compactFooter={navigationMode}
      />
      <CreateRequirementFormDialog
        requirements={props.requirements}
        tests={props.tests}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateRequirement={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
