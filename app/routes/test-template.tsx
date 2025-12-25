// Project
import type { TagPrimary, TestTemplateAll, TestPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTagsPrimaryFiltered,
  readTestTemplateAll,
  readTestsPrimaryFiltered
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useTestTemplateSubscription,
  useTestsFilteredSubscription
} from '~/hooks/resources'
import { TestTemplateViewer } from '~/components/single-resource-viewers/resources/test-template'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/test-template'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const testTemplateId = (() => {
    const parsed = parseInt(params.testTemplateId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [testTemplate] = await Promise.all([
    readTestTemplateAll(testTemplateId)
  ])
  const [tags, tests] = await Promise.all([
    readTagsPrimaryFiltered(testTemplate?.tagIds ?? null),
    readTestsPrimaryFiltered(testTemplate?.testIds ?? null)
  ])
  return {
    testTemplateId,
    tags,
    testTemplate,
    tests
  }
}

function TestTemplateRouteInner({
  loaderData: {
    testTemplateId,
    tags: initialTags,
    testTemplate: initialTestTemplate,
    tests: initialTests
  }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [tags, setTags] = React.useState<TagPrimary[] | null>(initialTags)
  const [testTemplate, setTestTemplate] =
    React.useState<TestTemplateAll | null>(initialTestTemplate)
  const [tests, setTests] = React.useState<TestPrimary[] | null>(initialTests)

  const tagIds = React.useMemo(
    () => testTemplate?.tagIds ?? null,
    [testTemplate]
  )
  const testIds = React.useMemo(
    () => testTemplate?.testIds ?? null,
    [testTemplate]
  )

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useTestTemplateSubscription('ALL_PROPS', testTemplateId, setTestTemplate)
  useTestsFilteredSubscription('PRIMARY_PROPS', testIds, null, setTests)

  React.useEffect(() => {
    if (testTemplateId === null) {
      notifier.showError(
        'указан некорректный идентификатор шаблона теста в URL'
      )
    } else if (
      testTemplate === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_TEST_TEMPLATE')
    ) {
      notifier.showError(
        `не удалось загрузить шаблон теста с идентификатором ${testTemplateId}`
      )
    }
  }, [testTemplateId, testTemplate, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_TEST_TEMPLATE') === false ? (
    <ForbiddenScreen />
  ) : testTemplateId !== null && testTemplate !== null ? (
    <TestTemplateViewer
      key={testTemplateId}
      tags={tags}
      testTemplate={testTemplate}
      tests={tests}
    />
  ) : null
}

export default function TestTemplateRoute(props: Route.ComponentProps) {
  return (
    <TestTemplateRouteInner key={props.loaderData.testTemplateId} {...props} />
  )
}
