// Project
import type {
  TopologyPrimary,
  DbcPrimary,
  TestTemplatePrimary,
  TestSecondary,
  SubgroupPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTopologiesPrimary,
  readDbcsPrimary,
  readTestTemplatesPrimary,
  readTestsSecondary,
  readSubgroupsPrimary
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTopologiesSubscription,
  useDbcsSubscription,
  useTestTemplatesSubscription,
  useTestsSubscription,
  useSubgroupsSubscription
} from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TestsScreen } from '~/components/screens/tests'
// React router
import type { Route } from './+types/tests'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [topologies, dbcs, testTemplates, tests, subgroups] = await Promise.all(
    [
      readTopologiesPrimary(),
      readDbcsPrimary(),
      readTestTemplatesPrimary(),
      readTestsSecondary(),
      readSubgroupsPrimary()
    ]
  )
  return {
    topologies,
    dbcs,
    testTemplates,
    tests,
    subgroups
  }
}

export default function TestsRoute({
  loaderData: {
    topologies: initialTopologies,
    dbcs: initialDbcs,
    testTemplates: initialTestTemplates,
    tests: initialTests,
    subgroups: initialSubgroups
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [topologies, setTopologies] = React.useState<TopologyPrimary[] | null>(
    initialTopologies
  )
  const [dbcs, setDbcs] = React.useState<DbcPrimary[] | null>(initialDbcs)
  const [testTemplates, setTestTemplates] = React.useState<
    TestTemplatePrimary[] | null
  >(initialTestTemplates)
  const [tests, setTests] = React.useState<TestSecondary[] | null>(initialTests)
  const [subgroups, setSubgroups] = React.useState<SubgroupPrimary[] | null>(
    initialSubgroups
  )

  useTopologiesSubscription('PRIMARY_PROPS', setTopologies)
  useDbcsSubscription('PRIMARY_PROPS', setDbcs)
  useTestTemplatesSubscription('PRIMARY_PROPS', setTestTemplates)
  useTestsSubscription('UP_TO_SECONDARY_PROPS', setTests)
  useSubgroupsSubscription('PRIMARY_PROPS', setSubgroups)

  React.useEffect(() => {
    if (
      tests === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TEST')
    ) {
      notifier.showError('не удалось загрузить список тестов')
    }
  }, [tests, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST') === false ? (
    <ForbiddenScreen />
  ) : tests !== null ? (
    <TestsScreen
      topologies={topologies}
      dbcs={dbcs}
      testTemplates={testTemplates}
      tests={tests}
      subgroups={subgroups}
    >
      {outlet !== null ? outlet : null}
    </TestsScreen>
  ) : null
}
