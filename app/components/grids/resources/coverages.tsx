// Project
import type { RequirementPrimary, CoverageSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateCoverageFormDialog } from '~/components/forms/resources/create-coverage'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useCoveragePercentCol,
  useCoverageTypeCol,
  useNameCol,
  useRequirementCol,
  useTestsCountCol
} from '../cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_COVERAGES_IN_MESSAGES = 3

export interface CoveragesGridProps {
  requirements: RequirementPrimary[] | null
  coverages: CoverageSecondary[]
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function CoveragesGrid(props: CoveragesGridProps) {
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
        (props.requirements ?? []).map((requirement) => [
          requirement.id,
          requirement.code
        ])
      ),
    [props.requirements]
  )

  const coverageForId = React.useMemo(
    () => new Map(props.coverages.map((coverage) => [coverage.id, coverage])),
    [props.coverages]
  )

  const coverageCodeForId = React.useMemo(
    () =>
      new Map(props.coverages.map((coverage) => [coverage.id, coverage.code])),
    [props.coverages]
  )

  const rows: GridValidRowModel[] = props.coverages

  const readCols = [
    useCodeCol('id', true, '/coverages', navigationMode),
    useNameCol(),
    useRequirementCol(props.requirements),
    useCoverageTypeCol(),
    useTestsCountCol(),
    useCoveragePercentCol()
  ]

  const navigationModeReadCols = React.useMemo(() => [readCols[0]], [readCols])

  const getRequirementCodeForCoverageId = React.useCallback(
    (coverageId: number) => {
      const requirementId = coverageForId.get(coverageId)?.requirementId
      const requirementCode =
        requirementId !== undefined
          ? requirementCodeForId.get(requirementId)
          : undefined
      return requirementCode
    },
    [requirementCodeForId, coverageForId]
  )

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      delete: rightsSet.has('DELETE_COVERAGE')
        ? {
            prepareConfirmMessage: (rowId) => {
              const requirementCode = getRequirementCodeForCoverageId(rowId)
              return `удалить покрытие '${coverageCodeForId.get(rowId) ?? ''}' требования '${requirementCode ?? ''}'?`
            },
            action: async (rowId) => {
              try {
                await serverConnector.deleteCoverage({
                  id: rowId
                })
                const requirementCode = getRequirementCodeForCoverageId(rowId)
                notifier.showSuccess(
                  `покрытие «${coverageCodeForId.get(rowId) ?? ''}» требования «${requirementCode ?? ''}» удалено`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, coverageCodeForId, getRequirementCodeForCoverageId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () =>
      navigationMode
        ? navigationModeReadCols
        : [
            ...readCols,
            ...(rightsSet.has('UPDATE_COVERAGE') ||
            rightsSet.has('DELETE_COVERAGE')
              ? [actionsCol]
              : [])
          ],
    [navigationMode, rightsSet, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof CoverageSecondary)[],
    []
  )

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_COVERAGE')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedCoverageCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_COVERAGES_IN_MESSAGES)
        .map((id) => coverageCodeForId.get(id) ?? '')
    },
    [coverageCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_COVERAGE')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedCoverageCodes = getDisplayedCoverageCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedCoverageCodes.length
              return `удалить покрыти${count === 1 ? 'е' : 'я'}${displayedCoverageCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedCoverageCodes = getDisplayedCoverageCodes(rowIds)
              try {
                await serverConnector.deleteCoverages({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedCoverageCodes.length
                notifier.showSuccess(
                  `покрыти${count === 1 ? 'е' : 'я'}${displayedCoverageCodes.map((code) => ` «${code}»`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'о' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [notifier, rightsSet, getDisplayedCoverageCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/coverages/${rowId}`
          : '/coverages'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="COVERAGES"
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
      <CreateCoverageFormDialog
        requirements={props.requirements}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateCoverage={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
