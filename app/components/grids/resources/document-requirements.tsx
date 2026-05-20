// Project
import type {
  DocumentTertiary,
  FragmentTertiary,
  RequirementSecondary,
  TestSecondary,
  SubgroupSecondary,
  GroupPrimary
} from '~/types'
import {
  readFragmentTertiary,
  readRequirementsSecondaryFiltered,
  readTestsSecondaryFiltered,
  readSubgroupsSecondaryFiltered,
  readGroupsSecondaryFiltered
} from '~/readers'
import { Grid } from '../grid'
import {
  useCoveredCol,
  useFragmentCol,
  useRequirementCol,
  useRequirementModifierCol,
  useRequirementOriginCol,
  useTestCol,
  useSubgroupCol,
  useGroupCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

export interface DocumentRequirementsGridProps {
  document: DocumentTertiary
}

export function DocumentRequirementsGrid({
  document
}: DocumentRequirementsGridProps) {
  const [fragments, setFragments] = React.useState<FragmentTertiary[]>([])
  const [requirements, setRequirements] = React.useState<
    RequirementSecondary[]
  >([])
  const [tests, setTests] = React.useState<TestSecondary[]>([])
  const [subgroups, setSubgroups] = React.useState<SubgroupSecondary[]>([])
  const [groups, setGroups] = React.useState<GroupPrimary[]>([])

  React.useEffect(() => {
    void (async () => {
      const fragmentIds = document.fragmentIds
      const fragments = (
        await Promise.all(
          fragmentIds.map((fragmentId) => readFragmentTertiary(fragmentId))
        )
      ).filter((fragment) => fragment !== null)
      const requirementIds = Array.from(
        new Set(fragments.flatMap((fragment) => fragment.requirementIds))
      )
      const requirements =
        (await readRequirementsSecondaryFiltered(requirementIds)) ?? []
      const testIds = Array.from(
        new Set(
          requirements
            .map((requirement) => requirement.testId)
            .filter((testId) => testId !== null)
        )
      )
      const tests = (await readTestsSecondaryFiltered(testIds)) ?? []
      const subgroupIds = Array.from(
        new Set(
          tests
            .map((test) => test.subgroupId)
            .filter((subgroupId) => subgroupId !== null)
        )
      )
      const subgroups =
        (await readSubgroupsSecondaryFiltered(subgroupIds)) ?? []
      const groupIds = Array.from(
        new Set(
          subgroups
            .map((subgroup) => subgroup.groupId)
            .filter((groupId) => groupId !== null)
        )
      )
      const groups = (await readGroupsSecondaryFiltered(groupIds)) ?? []
      setFragments(fragments)
      setRequirements(requirements)
      setTests(tests)
      setSubgroups(subgroups)
      setGroups(groups)
    })()
  }, [document])

  // const fragmentIdsSet = React.useMemo(
  //   () => new Set(fragments.map((fragment) => fragment.id)),
  //   [fragments]
  // )

  // const requirementIdsSet = React.useMemo(
  //   () => new Set(requirements.map((requirement) => requirement.id)),
  //   [requirements]
  // )

  // const testIdsSet = React.useMemo(
  //   () => new Set(tests.map((test) => test.id)),
  //   [tests]
  // )

  // const subgroupIdsSet = React.useMemo(
  //   () => new Set(subgroups.map((subgroup) => subgroup.id)),
  //   [subgroups]
  // )

  // const groupIdsSet = React.useMemo(
  //   () => new Set(groups.map((group) => group.id)),
  //   [groups]
  // )

  // const fragmentForId = React.useMemo(
  //   () => new Map(fragments.map((fragment) => [fragment.id, fragment])),
  //   [fragments]
  // )

  const requirementForId = React.useMemo(
    () =>
      new Map(
        requirements?.map((requirement) => [requirement.id, requirement])
      ),
    [requirements]
  )

  const testForId = React.useMemo(
    () => new Map(tests.map((test) => [test.id, test])),
    [tests]
  )

  const subgroupForId = React.useMemo(
    () => new Map(subgroups.map((subgroup) => [subgroup.id, subgroup])),
    [subgroups]
  )

  const groupForId = React.useMemo(
    () => new Map(groups.map((group) => [group.id, group])),
    [groups]
  )

  // const fragmentIdsWithoutRequirements = React.useMemo(
  //   () =>
  //     fragments
  //       .filter((fragment) => fragment.requirementsCount === 0)
  //       .map((fragment) => fragment.id),
  //   [fragments]
  // )

  // const requirementIdsWithoutTest = React.useMemo(
  //   () =>
  //     requirements
  //       .filter((requirement) => requirement.testId === null)
  //       .map((requirement) => requirement.id),
  //   [requirements]
  // )

  // const testIdsWithoutSubgroup = React.useMemo(
  //   () =>
  //     tests.filter((test) => test.subgroupId === null).map((test) => test.id),
  //   [tests]
  // )

  // const subgroupIdsWithoutGroup = React.useMemo(
  //   () =>
  //     subgroups
  //       .filter((subgroup) => subgroup.groupId === null)
  //       .map((subgroup) => subgroup.id),
  //   [subgroups]
  // )

  const rows: GridValidRowModel[] = React.useMemo(
    () =>
      [
        ...fragments.flatMap((fragment) => {
          const requirementIds = fragment.requirementIds
          if (requirementIds.length === 0) {
            return [
              {
                id: `++++${fragment.id}`,
                fragmentId: fragment.id,
                fragmentInnerCode: fragment.innerCode,
                requirementId: undefined,
                requirementCode: '',
                covered: false,
                modifier: '',
                origin: '',
                testId: undefined,
                testCode: '',
                subgroupId: undefined,
                subgroupCode: '',
                groupId: undefined,
                groupCode: ''
              }
            ]
          } else {
            return requirementIds.map((requirementId) => {
              const requirement = requirementForId.get(requirementId) ?? null
              const test =
                (requirement?.testId ?? null) !== null
                  ? (testForId.get(requirement!.testId!) ?? null)
                  : null
              const subgroup =
                (test?.subgroupId ?? null) !== null
                  ? (subgroupForId.get(test!.subgroupId!) ?? null)
                  : null
              const group =
                (subgroup?.groupId ?? null) !== null
                  ? (groupForId.get(subgroup!.groupId!) ?? null)
                  : null
              return {
                id: `${group?.id ?? ''}${subgroup?.id ?? ''}${test?.id ?? ''}${requirement?.id ?? ''}${fragment.id}`,
                fragmentId: fragment.id,
                fragmentInnerCode: fragment.innerCode,
                requirementId: requirement?.id ?? undefined,
                requirementCode: requirement?.code ?? '',
                covered: test !== null,
                modifier: requirement?.modifier ?? '',
                origin: requirement?.origin ?? '',
                testId: test?.id ?? undefined,
                testCode: test?.code ?? '',
                subgroupId: subgroup?.id ?? undefined,
                subgroupCode: subgroup?.code ?? '',
                groupId: group?.id ?? undefined,
                groupCode: group?.code ?? ''
              }
            })
          }
        })
      ].toSorted((fragment_1, fragment_2) => {
        function prepare(fragment: typeof fragment_1) {
          return `${fragment.groupCode} ${fragment.subgroupCode} ${fragment.testCode} ${fragment.requirementCode} ${fragment.fragmentInnerCode}`
        }
        return prepare(fragment_1).localeCompare(prepare(fragment_2))
      }),
    [
      fragments,
      requirements,
      requirementForId,
      testForId,
      subgroupForId,
      groupForId
    ]
  )

  const readCols = [
    useGroupCol(groups),
    useSubgroupCol(subgroups),
    useTestCol(tests),
    useRequirementCol(requirements),
    useCoveredCol('MIDDLE'),
    useRequirementModifierCol(),
    useRequirementOriginCol(),
    useFragmentCol(fragments)
  ]

  const cols: GridColDef[] = React.useMemo(() => readCols, [readCols])

  const defaultHiddenFields = React.useMemo(() => ['origin'], [])

  return (
    <>
      <Grid
        localSaveKey="DOCUMENT_REQUIREMENTS"
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
