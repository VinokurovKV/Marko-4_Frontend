// Project
import type {
  TagPrimary,
  RequirementPrimary,
  CommonTopologyTertiary,
  TopologyTertiary,
  DbcPrimary,
  TestTemplatePrimary,
  TestTertiary,
  SubgroupSecondary,
  GroupPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTestTertiary,
  readTagsPrimaryFiltered,
  readRequirementsPrimaryFiltered,
  readCommonTopologyTertiary,
  readTopologyTertiary,
  readDbcsPrimaryFiltered,
  readTestTemplatePrimary,
  readSubgroupSecondary,
  readGroupPrimary
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useRequirementsFilteredSubscription,
  useCommonTopologySubscription,
  useTopologySubscription,
  useDbcsFilteredSubscription,
  useTestTemplateSubscription,
  useTestSubscription,
  useSubgroupSubscription,
  useGroupSubscription
} from '~/hooks/resources'
import { TestViewer } from '~/components/single-resource-viewers/resources/test'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/test'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const testId = (() => {
    const parsed = parseInt(params.testId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [test] = await Promise.all([readTestTertiary(testId)])
  const tagIds = test?.tagIds ?? null
  const dbcIds = test?.dbcIds ?? null
  const [tags, requirements, topology, dbcs, testTemplate, subgroup] =
    await Promise.all([
      readTagsPrimaryFiltered(tagIds),
      readRequirementsPrimaryFiltered(test?.requirementIds ?? null),
      readTopologyTertiary(test?.topologyId ?? null),
      readDbcsPrimaryFiltered(dbcIds),
      readTestTemplatePrimary(test?.testTemplateId ?? null),
      readSubgroupSecondary(test?.subgroupId ?? null)
    ])
  const [commonTopology, group] = await Promise.all([
    readCommonTopologyTertiary(topology?.commonTopologyId ?? null),
    readGroupPrimary(subgroup?.groupId ?? null)
  ])
  return {
    testId,
    tags,
    requirements,
    commonTopology,
    topology,
    dbcs,
    testTemplate,
    test,
    subgroup,
    group
  }
}

function TestRouteInner({
  loaderData: {
    testId,
    tags: initialTags,
    requirements: initialRequirements,
    commonTopology: initialCommonTopology,
    topology: initialTopology,
    dbcs: initialDbcs,
    testTemplate: initialTestTemplate,
    test: initialTest,
    subgroup: initialSubgroup,
    group: initialGroup
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [tags, setTags] = React.useState<TagPrimary[] | null>(initialTags)
  const [requirements, setRequirements] = React.useState<
    RequirementPrimary[] | null
  >(initialRequirements)
  const [commonTopology, setCommonTopology] =
    React.useState<CommonTopologyTertiary | null>(initialCommonTopology)
  const [topology, setTopology] = React.useState<TopologyTertiary | null>(
    initialTopology
  )
  const [dbcs, setDbcs] = React.useState<DbcPrimary[] | null>(initialDbcs)
  const [testTemplate, setTestTemplate] =
    React.useState<TestTemplatePrimary | null>(initialTestTemplate)
  const [test, setTest] = React.useState<TestTertiary | null>(initialTest)
  const [subgroup, setSubgroup] = React.useState<SubgroupSecondary | null>(
    initialSubgroup
  )
  const [group, setGroup] = React.useState<GroupPrimary | null>(initialGroup)

  const tagIds = React.useMemo(() => test?.tagIds ?? null, [test])
  const requirementIds = React.useMemo(
    () => test?.requirementIds ?? null,
    [test]
  )
  const dbcIds = React.useMemo(() => test?.dbcIds ?? null, [test])

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useRequirementsFilteredSubscription(
    'PRIMARY_PROPS',
    requirementIds,
    setRequirements
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
  useTestSubscription('UP_TO_TERTIARY_PROPS', testId, setTest)
  useSubgroupSubscription(
    'UP_TO_SECONDARY_PROPS',
    test?.subgroupId ?? null,
    setSubgroup
  )
  useGroupSubscription('PRIMARY_PROPS', subgroup?.groupId ?? null, setGroup)

  React.useEffect(() => {
    if (testId === null) {
      notifier.showError('указан некорректный идентификатор теста в URL')
    } else if (
      test === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TEST')
    ) {
      notifier.showError(
        `не удалось загрузить тест с идентификатором ${testId}`
      )
    }
  }, [testId, test, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST') === false ? (
    <ForbiddenScreen />
  ) : testId !== null && test !== null ? (
    <TestViewer
      key={testId}
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

export default function TestRoute(props: Route.ComponentProps) {
  return <TestRouteInner key={props.loaderData.testId} {...props} />
}
