// Project
import type { ReadTagWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tags.dto'
import type { ReadRequirementsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/requirements.dto'
import type { ReadCoveragesWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/coverages.dto'
import type { ReadCommonTopologyWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/common-topologies.dto'
import type { ReadTopologyWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/topologies.dto'
import type { ReadDbcsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/dbcs.dto'
import type { ReadTestTemplateWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/test-templates.dto'
import type { ReadTestWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { ReadSubgroupWithUpToSecondaryPropsSuccessResultDto } from '@common/dtos/server-api/subgroups.dto'
import type { ReadGroupWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/groups.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  useTagsFilteredSubscription,
  useRequirementsFilteredSubscription,
  useCoveragesFilteredSubscription,
  useCommonTopologySubscription,
  useTopologySubscription,
  useDbcsFilteredSubscription,
  useTestTemplateSubscription,
  useTestSubscription,
  useSubgroupSubscription,
  useGroupSubscription
} from '~/hooks/resources'
import { TestViewer } from '../single-resource-viewers/resources/test'
// React
import * as React from 'react'

type Tag = DtoWithoutEnums<ReadTagWithPrimaryPropsSuccessResultDto>
type Requirement =
  DtoWithoutEnums<ReadRequirementsWithPrimaryPropsSuccessResultItemDto>
type Coverage =
  DtoWithoutEnums<ReadCoveragesWithUpToSecondaryPropsSuccessResultItemDto>
type CommonTopology =
  DtoWithoutEnums<ReadCommonTopologyWithUpToTertiaryPropsSuccessResultDto>
type Topology =
  DtoWithoutEnums<ReadTopologyWithUpToTertiaryPropsSuccessResultDto>
type Dbc = DtoWithoutEnums<ReadDbcsWithPrimaryPropsSuccessResultItemDto>
type TestTemplate =
  DtoWithoutEnums<ReadTestTemplateWithPrimaryPropsSuccessResultDto>
type Test = DtoWithoutEnums<ReadTestWithUpToTertiaryPropsSuccessResultDto>
type Subgroup =
  DtoWithoutEnums<ReadSubgroupWithUpToSecondaryPropsSuccessResultDto>
type Group = DtoWithoutEnums<ReadGroupWithPrimaryPropsSuccessResultDto>

export interface TestScreenProps {
  testId: number
  initialTags: Tag[] | null
  initialRequirements: Requirement[] | null
  initialCoverages: Coverage[] | null
  initialCommonTopology: CommonTopology | null
  initialTopology: Topology | null
  initialDbcs: Dbc[] | null
  initialTestTemplate: TestTemplate | null
  initialTest: Test | null
  initialSubgroup: Subgroup | null
  initialGroup: Group | null
}

export function TestScreen(props: TestScreenProps) {
  const [tags, setTags] = React.useState<Tag[] | null>(props.initialTags)
  const [requirements, setRequirements] = React.useState<Requirement[] | null>(
    props.initialRequirements
  )
  const [coverages, setCoverages] = React.useState<Coverage[] | null>(
    props.initialCoverages
  )
  const [commonTopology, setCommonTopology] =
    React.useState<CommonTopology | null>(props.initialCommonTopology)
  const [topology, setTopology] = React.useState<Topology | null>(
    props.initialTopology
  )
  const [dbcs, setDbcs] = React.useState<Dbc[] | null>(props.initialDbcs)
  const [testTemplate, setTestTemplate] = React.useState<TestTemplate | null>(
    props.initialTestTemplate
  )
  const [test, setTest] = React.useState<Test | null>(props.initialTest)
  const [subgroup, setSubgroup] = React.useState<Subgroup | null>(
    props.initialSubgroup
  )
  const [group, setGroup] = React.useState<Group | null>(props.initialGroup)

  const tagIds = React.useMemo(() => test?.tagIds ?? [], [test])
  const requirementIds = React.useMemo(
    () =>
      Array.from(
        new Set((coverages ?? []).map((coverage) => coverage.requirementId))
      ),
    [coverages]
  )
  const coverageIds = React.useMemo(() => test?.coverageIds ?? [], [test])
  const dbcIds = React.useMemo(() => test?.dbcIds ?? [], [test])

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useRequirementsFilteredSubscription(
    'PRIMARY_PROPS',
    requirementIds,
    setRequirements
  )
  useCoveragesFilteredSubscription(
    'UP_TO_SECONDARY_PROPS',
    coverageIds,
    setCoverages
  )
  useCommonTopologySubscription(
    'UP_TO_TERTIARY_PROPS',
    topology?.commonTopologyId ?? null,
    setCommonTopology
  )
  useTopologySubscription(
    'UP_TO_TERTIARY_PROPS',
    test?.topologyId ?? null,
    setTopology
  )
  useDbcsFilteredSubscription('PRIMARY_PROPS', dbcIds, setDbcs)
  useTestTemplateSubscription(
    'PRIMARY_PROPS',
    test?.testTemplateId ?? null,
    setTestTemplate
  )
  useTestSubscription('UP_TO_TERTIARY_PROPS', props.testId, setTest)
  useSubgroupSubscription(
    'UP_TO_SECONDARY_PROPS',
    test?.subgroupId ?? null,
    setSubgroup
  )
  useGroupSubscription('PRIMARY_PROPS', subgroup?.groupId ?? null, setGroup)

  return test !== null ? (
    <TestViewer
      tags={tags}
      requirements={requirements}
      commonTopology={commonTopology}
      topology={topology}
      dbcs={dbcs}
      testTemplate={testTemplate}
      test={test}
      subgroup={subgroup}
      group={group}
    />
  ) : null
}
