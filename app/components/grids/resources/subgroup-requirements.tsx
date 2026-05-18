// Project
import type {
  RequirementSecondary,
  TopologySecondary,
  TestSecondary
} from '~/types'
import { Grid } from '../grid'
import {
  useRequirementCol,
  useRequirementModifierCol,
  useRequirementOriginCol,
  useTopologyCol,
  useTestCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

export interface SubgroupRequirementsGridProps {
  requirements: RequirementSecondary[]
  topologies: TopologySecondary[] | null
  tests: TestSecondary[] | null
}

export function SubgroupRequirementsGrid({
  requirements,
  topologies,
  tests
}: SubgroupRequirementsGridProps) {
  const topologyForId = React.useMemo(
    () => new Map(topologies?.map((topology) => [topology.id, topology])),
    [topologies]
  )

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
        ...requirements.map((requirement) => {
          const test =
            requirement.testId !== null
              ? testForId.get(requirement.testId)
              : null
          const topology =
            (test?.topologyId ?? null) !== null
              ? (topologyForId.get(test!.topologyId) ?? null)
              : null
          return {
            id: `${requirement.id}`,
            requirementId: requirement.id,
            requirementCode: requirement.code,
            modifier: requirement.modifier,
            origin: requirement.origin,
            testId: requirement.testId ?? undefined,
            testCode: test?.code ?? '',
            topologyId: test?.topologyId ?? undefined,
            topologyCode: topology?.code ?? ''
          }
        }),
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
    [requirements, topologyForId, testForId, testIdsWithoutRequirements]
  )

  const readCols = [
    useTestCol(tests),
    useRequirementCol(requirements),
    useRequirementModifierCol(),
    useRequirementOriginCol(),
    useTopologyCol(topologies)
  ]

  const cols: GridColDef[] = React.useMemo(() => readCols, [readCols])

  const defaultHiddenFields = React.useMemo(() => ['origin', 'topologyId'], [])

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
