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
  const testCodeForId = React.useMemo(
    () => new Map(tests?.map((test) => [test.id, test.code])),
    [tests]
  )

  const testIdsWithoutRequirements = React.useMemo(() => {
    const testsIdsWithRequirementsSet = new Set(
      requirements
        .map((requirement) => requirement.testId)
        .filter((id) => id !== null)
    )
    return (tests ?? [])
      .map((test) => test.id)
      .filter((testId) => testsIdsWithRequirementsSet.has(testId) === false)
  }, [requirements, tests])

  const rows: GridValidRowModel[] = React.useMemo(
    () =>
      [
        ...requirements.map((requirement) => ({
          id: `${requirement.id}`,
          testId: requirement.testId,
          requirementId: requirement.id,
          modifier: requirement.modifier,
          origin: requirement.origin
        })),
        ...testIdsWithoutRequirements.map((testId) => ({
          id: `test-${testId}`,
          testId: testId
        }))
      ].toSorted((requirement_1, requirement_2) => {
        const testCode_1 =
          (requirement_1.testId !== null
            ? testCodeForId.get(requirement_1.testId)
            : '') ?? ''
        const testCode_2 =
          (requirement_2.testId !== null
            ? testCodeForId.get(requirement_2.testId)
            : '') ?? ''
        return testCode_1.localeCompare(testCode_2)
      }),
    [requirements, testCodeForId]
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
