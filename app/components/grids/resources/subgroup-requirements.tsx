// Project
import type { RequirementSecondary, TestPrimary } from '~/types'
import { Grid } from '../grid'
import {
  useRequirementCol,
  useRequirementModifierCol,
  useRequirementOriginCol,
  useTestCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

export interface SubgroupRequirementsGridProps {
  requirements: RequirementSecondary[]
  tests: TestPrimary[] | null
}

export function SubgroupRequirementsGrid({
  requirements,
  tests
}: SubgroupRequirementsGridProps) {
  const testForId = React.useMemo(
    () => new Map(tests?.map((test) => [test.id, test])),
    [tests]
  )

  const testIdsWithoutRequirements = React.useMemo(() => {
    const testIdsWithRequirementsSet = new Set(
      requirements
        .map((requirement) => requirement.testId)
        .filter((id) => id !== null)
    )
    return (tests ?? [])
      .map((test) => test.id)
      .filter((testId) => testIdsWithRequirementsSet.has(testId) === false)
  }, [requirements, tests])

  const rows: GridValidRowModel[] = React.useMemo(
    () =>
      [
        ...requirements.map((requirement) => ({
          id: `${requirement.id}`,
          requirementId: requirement.id,
          requirementCode: requirement.code,
          modifier: requirement.modifier,
          origin: requirement.origin,
          testId: requirement.testId ?? undefined,
          testCode:
            requirement.testId !== null
              ? (testForId.get(requirement.testId)?.code ?? '')
              : ''
        })),
        ...testIdsWithoutRequirements.map((testId) => ({
          id: `test-${testId}`,
          requirementCode: '',
          testId: testId,
          testCode: testForId.get(testId)?.code ?? ''
        }))
      ].toSorted((requirement_1, requirement_2) => {
        function prepare(requirement: typeof requirement_1) {
          return `${requirement.testCode} ${requirement.requirementCode}`
        }
        return prepare(requirement_1).localeCompare(prepare(requirement_2))
      }),
    [requirements, testForId, testIdsWithoutRequirements]
  )

  const readCols = [
    useTestCol(tests),
    useRequirementCol(requirements),
    useRequirementModifierCol(),
    useRequirementOriginCol()
  ]

  const cols: GridColDef[] = React.useMemo(() => readCols, [readCols])

  const defaultHiddenFields = React.useMemo(() => ['origin'], [])

  return (
    <>
      <Grid
        localSaveKey="SUBGROUP_REQUIREMENTS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={false}
        compactFooter
        rowSpanning
      />
    </>
  )
}
