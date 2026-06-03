// Project
import type {
  RequirementsHierarchy,
  DocumentTertiary,
  FragmentTertiary,
  RequirementSecondary,
  TestSecondary,
  SubgroupSecondary,
  GroupPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readFragmentTertiary,
  readRequirementsSecondaryFiltered,
  readTestsSecondaryFiltered,
  readSubgroupsSecondaryFiltered,
  readGroupsSecondaryFiltered
} from '~/readers'
import { Grid } from '../grid'
import {
  useAtomicRequirementCol,
  useCoveredCol,
  useFragmentsCol,
  useFullCoverageRateCol,
  useGroupCol,
  useMustAndShouldCoverageRateCol,
  useOnlyMayCoverageRateCol,
  useOnlyMustCoverageRateCol,
  useOnlyShouldCoverageRateCol,
  useRequirementCol,
  useRequirementModifierCol,
  useRequirementOriginCol,
  useSubgroupCol,
  useTestCol
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
  const [hierarchy, setHierarchy] = React.useState<RequirementsHierarchy>({
    vertexes: [],
    links: []
  })
  const [fragments, setFragments] = React.useState<FragmentTertiary[]>([])
  const [fragmentsWithoutRequirements, setFragmentsWithoutRequirements] =
    React.useState<FragmentTertiary[]>([])
  const [atomicIdsForMainRequirementId, setAtomicIdsForMainRequirementId] =
    React.useState<Map<number, number[]>>(new Map())
  const [mainRequirements, setMainRequirements] = React.useState<
    RequirementSecondary[]
  >([])
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
      const fragmentsWithoutRequirements = fragments.filter(
        (fragment) => fragment.requirementsCount === 0
      )
      const mainRequirementIds = Array.from(
        new Set(fragments.flatMap((fragment) => fragment.requirementIds))
      )
      const mainRequirements =
        (await readRequirementsSecondaryFiltered(mainRequirementIds)) ?? []
      const requirementsHierarchy =
        await serverConnector.readRequirementsHierarchy()
      const vertexForRequirementId = new Map(
        requirementsHierarchy.vertexes.map((vertex) => [vertex.id, vertex])
      )
      const childIdsForRequirementId = (() => {
        const childIdsForRequirementId = new Map<number, number[]>()
        for (const link of requirementsHierarchy.links) {
          if (childIdsForRequirementId.has(link.parentId) === false) {
            childIdsForRequirementId.set(link.parentId, [])
          }
          childIdsForRequirementId.get(link.parentId)?.push(link.childId)
        }
        return childIdsForRequirementId
      })()
      const atomicIdsForMainRequirementId = (() => {
        const atomicIdsForMainRequirementId = new Map<number, number[]>()
        for (const mainRequirementId of mainRequirementIds) {
          let atomicIds: number[] = []
          let notProcessedIds = [mainRequirementId]
          let processedIdsSet = new Set<number>()
          while (notProcessedIds.length > 0) {
            for (const requirementId of notProcessedIds) {
              if (processedIdsSet.has(requirementId) === false) {
                processedIdsSet.add(requirementId)
                const vertex = vertexForRequirementId.get(requirementId)
                if (vertex !== undefined) {
                  if (vertex.atomic) {
                    atomicIds.push(requirementId)
                  } else {
                    notProcessedIds.push(
                      ...(childIdsForRequirementId.get(requirementId) ?? [])
                    )
                  }
                }
              }
            }
            notProcessedIds = notProcessedIds.filter(
              (id) => processedIdsSet.has(id) === false
            )
          }
          atomicIdsForMainRequirementId.set(mainRequirementId, atomicIds)
        }
        return atomicIdsForMainRequirementId
      })()
      const atomicRequirementIds = (() => {
        const atomicRequirementIds: number[] = []
        for (const requirementId of mainRequirementIds) {
          atomicRequirementIds.push(
            ...(atomicIdsForMainRequirementId.get(requirementId) ?? [])
          )
        }
        return Array.from(new Set(atomicRequirementIds))
      })()
      const allRequirementIds = Array.from(
        new Set([...mainRequirementIds, ...atomicRequirementIds])
      )
      const allRequirements =
        (await readRequirementsSecondaryFiltered(allRequirementIds)) ?? []
      const atomicRequirements = allRequirements.filter(
        (requirement) => requirement.childRequirementsCount === 0
      )
      const testIds = Array.from(
        new Set(
          atomicRequirements
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
      setHierarchy(requirementsHierarchy)
      setFragments(fragments)
      setFragmentsWithoutRequirements(fragmentsWithoutRequirements)
      setAtomicIdsForMainRequirementId(atomicIdsForMainRequirementId)
      setMainRequirements(mainRequirements)
      setRequirements(allRequirements)
      setTests(tests)
      setSubgroups(subgroups)
      setGroups(groups)
    })()
  }, [document])

  const vertexForRequirementId = React.useMemo(
    () => new Map(hierarchy.vertexes.map((vertex) => [vertex.id, vertex])),
    [hierarchy]
  )

  const fragmentForId = React.useMemo(
    () => new Map(fragments?.map((fragment) => [fragment.id, fragment])),
    [fragments]
  )

  const requirementForId = React.useMemo(
    () =>
      new Map(
        requirements?.map((requirement) => [requirement.id, requirement])
      ),
    [requirements]
  )

  const fragmentIdsForRequirementId = React.useMemo(() => {
    const result = new Map<number, number[]>()
    for (const fragment of fragments) {
      for (const requirementId of fragment.requirementIds) {
        if (result.has(requirementId) === false) {
          result.set(requirementId, [])
        }
        result.get(requirementId)!.push(fragment.id)
      }
    }
    return result
  }, [fragments])

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

  const rows: GridValidRowModel[] = React.useMemo(
    () =>
      [
        ...(fragmentsWithoutRequirements.length > 0
          ? [
              {
                id: '+',
                fragmentIds: fragmentsWithoutRequirements.map(
                  (fragment) => fragment.id
                ),
                fragmentInnerCodes: fragmentsWithoutRequirements.map(
                  (fragment) => fragment.innerCode
                ),
                requirementId: undefined,
                requirementCode: '',
                fullCoverageRate: undefined,
                onlyMustCoverageRate: undefined,
                mustAndShouldCoverageRate: undefined,
                onlyShouldCoverageRate: undefined,
                onlyMayCoverageRate: undefined,
                atomicRequirementId: undefined,
                atomicRequirementCode: '',
                modifier: '',
                origin: '',
                covered: undefined,
                testId: undefined,
                subgroupId: undefined,
                groupId: undefined
              }
            ]
          : []),
        ...mainRequirements.flatMap((mainRequirement) => {
          const mainRequirementId = mainRequirement.id
          const mainRequirementVertex =
            vertexForRequirementId.get(mainRequirementId)
          const fragmentIds =
            fragmentIdsForRequirementId.get(mainRequirementId) ?? []
          const atomicRequirementIds =
            atomicIdsForMainRequirementId.get(mainRequirementId) ?? []
          return atomicRequirementIds.map((atomicRequirementId) => {
            const atomicRequirement =
              requirementForId.get(atomicRequirementId) ?? null
            const atomicRequirementVertex =
              vertexForRequirementId.get(atomicRequirementId)
            const test =
              (atomicRequirement?.testId ?? null) !== null
                ? (testForId.get(atomicRequirement!.testId!) ?? null)
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
              id: `${fragmentIds.join('-')}+${mainRequirementId}+${atomicRequirementId}`,
              fragmentIds: fragmentIds,
              fragmentInnerCodes: fragmentIds.map(
                (fragmentId) => fragmentForId.get(fragmentId)?.id
              ),
              requirementId: mainRequirementId,
              requirementCode: mainRequirementVertex?.code ?? '',
              fullCoverageRate:
                atomicRequirementVertex !== undefined
                  ? atomicRequirementVertex.atomic
                    ? `${atomicRequirementVertex.testId !== null ? '1' : '0'} / 1`
                    : `${atomicRequirementVertex.coveredRate.full} / ${atomicRequirementVertex.aggregateRate.full}`
                  : '0 / 0',
              onlyMustCoverageRate:
                atomicRequirementVertex !== undefined
                  ? atomicRequirementVertex.atomic
                    ? `${atomicRequirementVertex.testId !== null && atomicRequirementVertex.modifier === 'MUST' ? '1' : '0'} / ${atomicRequirementVertex.modifier === 'MUST' ? '1' : '0'}`
                    : `${atomicRequirementVertex.coveredRate.onlyMust} / ${atomicRequirementVertex.aggregateRate.onlyMust}`
                  : '0 / 0',
              mustAndShouldCoverageRate:
                atomicRequirementVertex !== undefined
                  ? atomicRequirementVertex.atomic
                    ? `${atomicRequirementVertex.testId !== null && atomicRequirementVertex.modifier !== 'MAY' ? '1' : '0'} / ${atomicRequirementVertex.modifier !== 'MAY' ? '1' : '0'}`
                    : `${atomicRequirementVertex.coveredRate.mustAndShould} / ${atomicRequirementVertex.aggregateRate.mustAndShould}`
                  : '0 / 0',
              onlyShouldCoverageRate:
                atomicRequirementVertex !== undefined
                  ? atomicRequirementVertex.atomic
                    ? `${atomicRequirementVertex.testId !== null && atomicRequirementVertex.modifier === 'SHOULD' ? '1' : '0'} / ${atomicRequirementVertex.modifier === 'SHOULD' ? '1' : '0'}`
                    : `${atomicRequirementVertex.coveredRate.onlyShould} / ${atomicRequirementVertex.aggregateRate.onlyShould}`
                  : '0 / 0',
              onlyMayCoverageRate:
                atomicRequirementVertex !== undefined
                  ? atomicRequirementVertex.atomic
                    ? `${atomicRequirementVertex.testId !== null && atomicRequirementVertex.modifier === 'MAY' ? '1' : '0'} / ${atomicRequirementVertex.modifier === 'MAY' ? '1' : '0'}`
                    : `${atomicRequirementVertex.coveredRate.onlyMay} / ${atomicRequirementVertex.aggregateRate.onlyMay}`
                  : '0 / 0',
              atomicRequirementId: atomicRequirementId,
              atomicRequirementCode: atomicRequirement?.code ?? '',
              modifier: atomicRequirement?.modifier ?? '',
              origin: atomicRequirement?.origin ?? '',
              covered: (atomicRequirement?.testId ?? null) !== null,
              testId: test?.id ?? undefined,
              subgroupId: subgroup?.id ?? undefined,
              groupId: group?.id ?? undefined
            }
          })
        })
      ].toSorted((raw_1, raw_2) => {
        function prepare(raw: typeof raw_1) {
          return `${raw_1.fragmentInnerCodes.join(', ')} ${raw_1.atomicRequirementCode}`
        }
        return prepare(raw_1).localeCompare(prepare(raw_2))
      }),
    [
      hierarchy,
      fragments,
      fragmentsWithoutRequirements,
      atomicIdsForMainRequirementId,
      mainRequirements,
      requirements,
      tests,
      subgroups,
      groups,
      vertexForRequirementId,
      fragmentForId,
      requirementForId,
      fragmentIdsForRequirementId,
      testForId,
      subgroupForId,
      groupForId
    ]
  )

  // const rows: GridValidRowModel[] = React.useMemo(
  //   () =>
  //     [
  //       ...fragments.flatMap((fragment) => {
  //         const requirementIds = fragment.requirementIds
  //         if (requirementIds.length === 0) {
  //           return [
  //             {
  //               id: `++++${fragment.id}`,
  //               fragmentIds: [fragment.id],
  //               fragmentInnerCode: fragment.innerCode,
  //               requirementId: undefined,
  //               requirementCode: '',
  //               covered: false,
  //               modifier: '',
  //               origin: '',
  //               testId: undefined,
  //               testCode: '',
  //               subgroupId: undefined,
  //               subgroupCode: '',
  //               groupId: undefined,
  //               groupCode: ''
  //             }
  //           ]
  //         } else {
  //           return requirementIds.map((requirementId) => {
  //             const requirement = requirementForId.get(requirementId) ?? null
  //             const test =
  //               (requirement?.testId ?? null) !== null
  //                 ? (testForId.get(requirement!.testId!) ?? null)
  //                 : null
  //             const subgroup =
  //               (test?.subgroupId ?? null) !== null
  //                 ? (subgroupForId.get(test!.subgroupId!) ?? null)
  //                 : null
  //             const group =
  //               (subgroup?.groupId ?? null) !== null
  //                 ? (groupForId.get(subgroup!.groupId!) ?? null)
  //                 : null
  //             return {
  //               id: `${group?.id ?? ''}${subgroup?.id ?? ''}${test?.id ?? ''}${requirement?.id ?? ''}${fragment.id}`,
  //               fragmentIds: [fragment.id],
  //               fragmentInnerCode: fragment.innerCode,
  //               requirementId: requirement?.id ?? undefined,
  //               requirementCode: requirement?.code ?? '',
  //               covered: test !== null,
  //               modifier: requirement?.modifier ?? '',
  //               origin: requirement?.origin ?? '',
  //               testId: test?.id ?? undefined,
  //               testCode: test?.code ?? '',
  //               subgroupId: subgroup?.id ?? undefined,
  //               subgroupCode: subgroup?.code ?? '',
  //               groupId: group?.id ?? undefined,
  //               groupCode: group?.code ?? ''
  //             }
  //           })
  //         }
  //       })
  //     ].toSorted((fragment_1, fragment_2) => {
  //       function prepare(fragment: typeof fragment_1) {
  //         return `${fragment.groupCode} ${fragment.subgroupCode} ${fragment.testCode} ${fragment.requirementCode} ${fragment.fragmentInnerCode}`
  //       }
  //       return prepare(fragment_1).localeCompare(prepare(fragment_2))
  //     }),
  //   [
  //     fragments,
  //     requirements,
  //     requirementForId,
  //     testForId,
  //     subgroupForId,
  //     groupForId
  //   ]
  // )

  const readCols = [
    useFragmentsCol(fragments),
    useRequirementCol(mainRequirements),
    useFullCoverageRateCol(),
    useOnlyMustCoverageRateCol(),
    useMustAndShouldCoverageRateCol(),
    useOnlyShouldCoverageRateCol(),
    useOnlyMayCoverageRateCol(),
    useAtomicRequirementCol(requirements),
    useRequirementModifierCol(),
    useRequirementOriginCol(),
    useCoveredCol('MIDDLE'),
    useTestCol(tests),
    useSubgroupCol(subgroups),
    useGroupCol(groups)
  ]

  const cols: GridColDef[] = React.useMemo(() => readCols, [readCols])

  const defaultHiddenFields = React.useMemo(
    () => [
      'origin',
      'fullCoverageRate',
      'mustAndShouldCoverageRate',
      'onlyShouldCoverageRate',
      'onlyMayCoverageRate'
    ],
    []
  )

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
