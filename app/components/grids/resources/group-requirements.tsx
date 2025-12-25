// Project
import type {
  RequirementSecondary,
  TestSecondary,
  SubgroupPrimary
} from '~/types'
import { Grid } from '../grid'
import {
  useRequirementCol,
  useRequirementModifierCol,
  useRequirementOriginCol,
  useTestCol,
  useSubgroupCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

export interface GroupRequirementsGridProps {
  requirements: RequirementSecondary[]
  tests: TestSecondary[] | null
  subgroups: SubgroupPrimary[] | null
}

export function GroupRequirementsGrid({
  requirements,
  tests,
  subgroups
}: GroupRequirementsGridProps) {
  const testForId = React.useMemo(
    () => new Map(tests?.map((test) => [test.id, test])),
    [tests]
  )

  const subgroupForId = React.useMemo(
    () => new Map(subgroups?.map((subgroup) => [subgroup.id, subgroup])),
    [subgroups]
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

  const subgroupIdsWithoutTests = React.useMemo(() => {
    const subgroupIdsWitTestsSet = new Set(
      tests?.map((test) => test.subgroupId).filter((id) => id !== null)
    )
    return (subgroups ?? [])
      .map((subgroup) => subgroup.id)
      .filter((subgroupId) => subgroupIdsWitTestsSet.has(subgroupId) === false)
  }, [tests, subgroups])

  const rows: GridValidRowModel[] = React.useMemo(
    () =>
      [
        ...requirements.map((requirement) => {
          const test =
            requirement.testId !== null
              ? testForId.get(requirement.testId)
              : null
          const subgroup =
            (test?.subgroupId ?? null) !== null
              ? (subgroupForId.get(test!.subgroupId!) ?? null)
              : null
          return {
            id: `${requirement.id}`,
            requirementId: requirement.id,
            requirementCode: requirement.code,
            modifier: requirement.modifier,
            origin: requirement.origin,
            testId: requirement.testId ?? undefined,
            testCode: test?.code ?? '',
            subgroupId: test?.subgroupId ?? undefined,
            subgroupCode: subgroup?.code ?? ''
          }
        }),
        ...testIdsWithoutRequirements.map((testId) => {
          const test = testForId.get(testId) ?? null
          const subgroup =
            (test?.subgroupId ?? null) !== null
              ? subgroupForId.get(test!.subgroupId!)
              : null
          return {
            id: `test-${testId}`,
            requirementCode: '',
            testId: testId,
            testCode: test?.code ?? '',
            subgroupId: test?.subgroupId,
            subgroupCode: subgroup?.code ?? ''
          }
        }),
        ...subgroupIdsWithoutTests.map((subgroupId) => {
          const subgroup = subgroupForId.get(subgroupId) ?? null
          return {
            id: `subgroup-${subgroupId}`,
            requirementCode: '',
            testId: undefined,
            testCode: '',
            subgroupId: subgroupId,
            subgroupCode: subgroup?.code ?? ''
          }
        })
      ].toSorted((requirement_1, requirement_2) => {
        function prepare(requirement: typeof requirement_1) {
          return `${requirement.subgroupCode} ${requirement.testCode} ${requirement.requirementCode ?? ''}`
        }
        return prepare(requirement_1).localeCompare(prepare(requirement_2))
      }),
    [
      requirements,
      testForId,
      subgroupForId,
      testIdsWithoutRequirements,
      subgroupIdsWithoutTests
    ]
  )

  const readCols = [
    useSubgroupCol(subgroups),
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
        localSaveKey="GROUP_REQUIREMENTS"
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
