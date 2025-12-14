// Project
import type {
  TagAll,
  DocumentPrimary,
  FragmentPrimary,
  RequirementPrimary,
  CoveragePrimary,
  CommonTopologyPrimary,
  TopologyPrimary,
  DbcPrimary,
  TestTemplatePrimary,
  TestPrimary,
  SubgroupPrimary,
  GroupPrimary,
  DevicePrimary,
  TaskPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTagAll,
  readDocumentsPrimaryFiltered,
  readFragmentsPrimaryFiltered,
  readRequirementsPrimaryFiltered,
  readCoveragesPrimaryFiltered,
  readCommonTopologiesPrimaryFiltered,
  readTopologiesPrimaryFiltered,
  readDbcsPrimaryFiltered,
  readTestTemplatesPrimaryFiltered,
  readTestsPrimaryFiltered,
  readSubgroupsPrimaryFiltered,
  readGroupsPrimaryFiltered,
  readDevicesPrimaryFiltered,
  readTasksPrimaryFiltered
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagSubscription,
  useDocumentsFilteredSubscription,
  useFragmentsFilteredSubscription,
  useRequirementsFilteredSubscription,
  useCoveragesFilteredSubscription,
  useCommonTopologiesFilteredSubscription,
  useTopologiesFilteredSubscription,
  useDbcsFilteredSubscription,
  useTestTemplatesFilteredSubscription,
  useTestsFilteredSubscription,
  useSubgroupsFilteredSubscription,
  useGroupsFilteredSubscription,
  useDevicesFilteredSubscription,
  useTasksFilteredSubscription
} from '~/hooks/resources'
import { TagViewer } from '~/components/single-resource-viewers/resources/tag'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/tag'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const tagId = (() => {
    const parsed = parseInt(params.tagId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [tag] = await Promise.all([readTagAll(tagId)])
  const [
    documents,
    fragments,
    requirements,
    coverages,
    commonTopologies,
    topologies,
    dbcs,
    testTemplates,
    tests,
    subgroups,
    groups,
    devices,
    tasks
  ] = await Promise.all([
    readDocumentsPrimaryFiltered(tag?.documentIds ?? null),
    readFragmentsPrimaryFiltered(tag?.fragmentIds ?? null),
    readRequirementsPrimaryFiltered(tag?.requirementIds ?? null),
    readCoveragesPrimaryFiltered(tag?.coverageIds ?? null),
    readCommonTopologiesPrimaryFiltered(tag?.commonTopologyIds ?? null),
    readTopologiesPrimaryFiltered(tag?.topologyIds ?? null),
    readDbcsPrimaryFiltered(tag?.dbcIds ?? null),
    readTestTemplatesPrimaryFiltered(tag?.testTemplateIds ?? null),
    readTestsPrimaryFiltered(tag?.testIds ?? null),
    readSubgroupsPrimaryFiltered(tag?.subgroupIds ?? null),
    readGroupsPrimaryFiltered(tag?.groupIds ?? null),
    readDevicesPrimaryFiltered(tag?.deviceIds ?? null),
    readTasksPrimaryFiltered(tag?.taskIds ?? null)
  ])
  const [documentsForFragments] = await Promise.all([
    readDocumentsPrimaryFiltered(
      fragments !== null
        ? Array.from(new Set(fragments.map((fragment) => fragment.documentId)))
        : null
    )
  ])
  return {
    tagId,
    tag,
    documents,
    documentsForFragments,
    fragments,
    requirements,
    coverages,
    commonTopologies,
    topologies,
    dbcs,
    testTemplates,
    tests,
    subgroups,
    groups,
    devices,
    tasks
  }
}

function TagRouteInner({
  loaderData: {
    tagId,
    tag: initialTag,
    documents: initialDocuments,
    documentsForFragments: initialDocumentsForFragments,
    fragments: initialFragments,
    requirements: initialRequirements,
    coverages: initialCoverages,
    commonTopologies: initialCommonTopologies,
    topologies: initialTopologies,
    dbcs: initialDbcs,
    testTemplates: initialTestTemplates,
    tests: initialTests,
    subgroups: initialSubgroups,
    groups: initialGroups,
    devices: initialDevices,
    tasks: initialTasks
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [tag, setTag] = React.useState<TagAll | null>(initialTag)
  const [documents, setDocuments] = React.useState<DocumentPrimary[] | null>(
    initialDocuments
  )
  const [documentsForFragments, setDocumentsForFragments] = React.useState<
    DocumentPrimary[] | null
  >(initialDocumentsForFragments)
  const [fragments, setFragments] = React.useState<FragmentPrimary[] | null>(
    initialFragments
  )
  const [requirements, setRequirements] = React.useState<
    RequirementPrimary[] | null
  >(initialRequirements)
  const [coverages, setCoverages] = React.useState<CoveragePrimary[] | null>(
    initialCoverages
  )
  const [commonTopologies, setCommonTopologies] = React.useState<
    CommonTopologyPrimary[] | null
  >(initialCommonTopologies)
  const [topologies, setTopologies] = React.useState<TopologyPrimary[] | null>(
    initialTopologies
  )
  const [dbcs, setDbcs] = React.useState<DbcPrimary[] | null>(initialDbcs)
  const [testTemplates, setTestTemplates] = React.useState<
    TestTemplatePrimary[] | null
  >(initialTestTemplates)
  const [tests, setTests] = React.useState<TestPrimary[] | null>(initialTests)
  const [subgroups, setSubgroups] = React.useState<SubgroupPrimary[] | null>(
    initialSubgroups
  )
  const [groups, setGroups] = React.useState<GroupPrimary[] | null>(
    initialGroups
  )
  const [devices, setDevices] = React.useState<DevicePrimary[] | null>(
    initialDevices
  )
  const [tasks, setTasks] = React.useState<TaskPrimary[] | null>(initialTasks)

  const documentForFragmentsIds = React.useMemo(
    () =>
      fragments !== null
        ? Array.from(new Set(fragments.map((fragment) => fragment.documentId)))
        : null,
    [fragments]
  )

  useTagSubscription('ALL_PROPS', tagId, setTag)
  useDocumentsFilteredSubscription(
    'PRIMARY_PROPS',
    tag?.documentIds ?? null,
    setDocuments
  )
  useDocumentsFilteredSubscription(
    'PRIMARY_PROPS',
    documentForFragmentsIds,
    setDocumentsForFragments
  )
  useFragmentsFilteredSubscription(
    'PRIMARY_PROPS',
    tag?.fragmentIds ?? null,
    setFragments
  )
  useRequirementsFilteredSubscription(
    'PRIMARY_PROPS',
    tag?.requirementIds ?? null,
    setRequirements
  )
  useCoveragesFilteredSubscription(
    'PRIMARY_PROPS',
    tag?.coverageIds ?? null,
    setCoverages
  )
  useCommonTopologiesFilteredSubscription(
    'PRIMARY_PROPS',
    tag?.commonTopologyIds ?? null,
    setCommonTopologies
  )
  useTopologiesFilteredSubscription(
    'PRIMARY_PROPS',
    tag?.topologyIds ?? null,
    setTopologies
  )
  useDbcsFilteredSubscription('PRIMARY_PROPS', tag?.dbcIds ?? null, setDbcs)
  useTestTemplatesFilteredSubscription(
    'PRIMARY_PROPS',
    tag?.testTemplateIds ?? null,
    setTestTemplates
  )
  useTestsFilteredSubscription('PRIMARY_PROPS', tag?.testIds ?? null, setTests)
  useSubgroupsFilteredSubscription(
    'PRIMARY_PROPS',
    tag?.subgroupIds ?? null,
    setSubgroups
  )
  useGroupsFilteredSubscription(
    'PRIMARY_PROPS',
    tag?.groupIds ?? null,
    setGroups
  )
  useDevicesFilteredSubscription(
    'PRIMARY_PROPS',
    tag?.deviceIds ?? null,
    setDevices
  )
  useTasksFilteredSubscription('PRIMARY_PROPS', tag?.taskIds ?? null, setTasks)

  React.useEffect(() => {
    if (tagId === null) {
      notifier.showError('указан некорректный идентификатор тега в URL')
    } else if (
      tag === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TAG')
    ) {
      notifier.showError(`не удалось загрузить тег с идентификатором ${tagId}`)
    }
  }, [tagId, tag, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TAG') === false ? (
    <ForbiddenScreen />
  ) : tagId !== null && tag !== null ? (
    <TagViewer
      key={tagId}
      tag={tag}
      documents={documents}
      documentsForFragments={documentsForFragments}
      fragments={fragments}
      requirements={requirements}
      coverages={coverages}
      commonTopologies={commonTopologies}
      topologies={topologies}
      dbcs={dbcs}
      testTemplates={testTemplates}
      tests={tests}
      subgroups={subgroups}
      groups={groups}
      devices={devices}
      tasks={tasks}
    />
  ) : null
}

export default function TagRoute(props: Route.ComponentProps) {
  return <TagRouteInner key={props.loaderData.tagId} {...props} />
}
