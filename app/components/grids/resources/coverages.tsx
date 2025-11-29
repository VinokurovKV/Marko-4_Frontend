// Project
import type { ReadRequirementsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/requirements.dto'
import type { ReadCoveragesWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/coverages.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useCoveragesSubscription,
  useRequirementsSubscription
} from '~/hooks/resources'
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
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_COVERAGES_IN_MESSAGES = 3

type Requirement =
  DtoWithoutEnums<ReadRequirementsWithPrimaryPropsSuccessResultItemDto>
type Coverage =
  DtoWithoutEnums<ReadCoveragesWithUpToSecondaryPropsSuccessResultItemDto>

export interface CoveragesGridProps {
  initialRequirements: Requirement[] | null
  initialCoverages: Coverage[]
}

export function CoveragesGrid(props: CoveragesGridProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet =
    meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const [requirements, setRequirements] = React.useState<Requirement[] | null>(
    props.initialRequirements
  )
  const [coverages, setCoverages] = React.useState<Coverage[]>(
    props.initialCoverages
  )

  useRequirementsSubscription('PRIMARY_PROPS', setRequirements)
  useCoveragesSubscription('UP_TO_SECONDARY_PROPS', setCoverages)

  const requirementCodeForId = React.useMemo(
    () =>
      new Map(
        (requirements ?? []).map((requirement) => [
          requirement.id,
          requirement.code
        ])
      ),
    [requirements]
  )

  const coverageForId = React.useMemo(
    () => new Map(coverages.map((coverage) => [coverage.id, coverage])),
    [coverages]
  )

  const coverageCodeForId = React.useMemo(
    () => new Map(coverages.map((coverage) => [coverage.id, coverage.code])),
    [coverages]
  )

  const rows: GridValidRowModel[] = coverages

  const readCols = [
    useCodeCol('id', true, '/coverages'),
    useNameCol(),
    useRequirementCol(requirements),
    useCoverageTypeCol(),
    useTestsCountCol(),
    useCoveragePercentCol()
  ]

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
                  `покрытие '${coverageCodeForId.get(rowId) ?? ''} 'требования '${requirementCode ?? ''}' удалено`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [rightsSet, coverageCodeForId, getRequirementCodeForCoverageId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      ...readCols,
      ...(rightsSet.has('UPDATE_COVERAGE') || rightsSet.has('DELETE_COVERAGE')
        ? [actionsCol]
        : [])
    ],
    [readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(() => [] as (keyof Coverage)[], [])

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
                  `покрыти${count === 1 ? 'е' : 'я'}${displayedCoverageCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'о' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [rightsSet, getDisplayedCoverageCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  return (
    <>
      <Grid
        localSaveKey="COVERAGES"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateCoverageFormDialog
        requirements={requirements}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateCoverage={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
