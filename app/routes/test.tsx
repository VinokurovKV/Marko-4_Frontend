// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TestScreen } from '~/components/screens/test'
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
  const [test] = await (async () => {
    if (testId === null || serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_TEST')
          ? serverConnector
              .readTest(
                {
                  id: testId
                },
                {
                  scope: 'UP_TO_TERTIARY_PROPS'
                }
              )
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  const tagIds = test?.tagIds ?? []
  const coverageIds = test?.coverageIds ?? []
  const dbcIds = test?.dbcIds ?? []
  const [tags, coverages, topology, dbcs, testTemplate, subgroup] =
    await (async () => {
      if (serverConnector.meta.status !== 'AUTHENTICATED' || test === null) {
        return [null, null, null, null, null, null]
      } else {
        const rights = serverConnector.meta.selfMeta.rights
        return await Promise.all([
          rights.includes('READ_TAG')
            ? serverConnector
                .readTags({
                  ids: tagIds,
                  scope: 'PRIMARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_COVERAGE')
            ? serverConnector
                .readCoverages({
                  ids: coverageIds,
                  scope: 'UP_TO_SECONDARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_TOPOLOGY')
            ? serverConnector
                .readTopology(
                  { id: test.topologyId },
                  {
                    scope: 'UP_TO_TERTIARY_PROPS'
                  }
                )
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_DBC')
            ? serverConnector
                .readDbcs({
                  ids: dbcIds,
                  scope: 'PRIMARY_PROPS'
                })
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_TEST_TEMPLATE') && test.testTemplateId !== null
            ? serverConnector
                .readTestTemplate(
                  { id: test.testTemplateId },
                  {
                    scope: 'PRIMARY_PROPS'
                  }
                )
                .catch(() => null)
            : Promise.resolve(null),
          rights.includes('READ_SUBGROUP') && test.subgroupId !== null
            ? serverConnector
                .readSubgroup(
                  { id: test.subgroupId },
                  {
                    scope: 'UP_TO_SECONDARY_PROPS'
                  }
                )
                .catch(() => null)
            : Promise.resolve(null)
        ])
      }
    })()
  const requirementIds = Array.from(
    new Set((coverages ?? []).map((coverage) => coverage.requirementId))
  )
  const [requirements, commonTopology, group] = await (async () => {
    if (serverConnector.meta.status !== 'AUTHENTICATED') {
      return [null, null, null]
    } else {
      const rights = serverConnector.meta.selfMeta.rights
      return await Promise.all([
        rights.includes('READ_REQUIREMENT')
          ? serverConnector
              .readRequirements({
                ids: requirementIds,
                scope: 'PRIMARY_PROPS'
              })
              .catch(() => null)
          : Promise.resolve(null),
        rights.includes('READ_COMMON_TOPOLOGY') && topology !== null
          ? serverConnector
              .readCommonTopology(
                {
                  id: topology.commonTopologyId
                },
                {
                  scope: 'UP_TO_TERTIARY_PROPS'
                }
              )
              .catch(() => null)
          : Promise.resolve(null),
        rights.includes('READ_GROUP') &&
        subgroup !== null &&
        subgroup.groupId !== null
          ? serverConnector
              .readGroup(
                {
                  id: subgroup.groupId
                },
                {
                  scope: 'PRIMARY_PROPS'
                }
              )
              .catch(() => null)
          : Promise.resolve(null)
      ])
    }
  })()
  return {
    testId,
    tags,
    requirements,
    coverages,
    commonTopology,
    topology,
    dbcs,
    testTemplate,
    test,
    subgroup,
    group
  }
}

export default function MetaRoute({
  loaderData: {
    testId,
    tags,
    requirements,
    coverages,
    commonTopology,
    topology,
    dbcs,
    testTemplate,
    test,
    subgroup,
    group
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  React.useEffect(() => {
    if (testId === null) {
      notifier.showError('указан некорректный идентификатор при загрузке теста')
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
    <TestScreen
      key={testId}
      testId={testId}
      initialTags={tags}
      initialRequirements={requirements}
      initialCoverages={coverages}
      initialCommonTopology={commonTopology}
      initialTopology={topology}
      initialDbcs={dbcs}
      initialTestTemplate={testTemplate}
      initialTest={test}
      initialSubgroup={subgroup}
      initialGroup={group}
    />
  ) : null
}
