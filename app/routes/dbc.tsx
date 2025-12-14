// Project
import type { TagPrimary, DbcAll, TestPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import {
  readTagsPrimaryFiltered,
  readDbcAll,
  readTestsPrimaryFiltered
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useTagsFilteredSubscription,
  useDbcSubscription,
  useTestsFilteredSubscription
} from '~/hooks/resources'
import { DbcViewer } from '~/components/single-resource-viewers/resources/dbc'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// React router
import type { Route } from './+types/dbc'
// React
import * as React from 'react'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const dbcId = (() => {
    const parsed = parseInt(params.dbcId)
    return isNaN(parsed) ? null : parsed
  })()
  await serverConnector.connect()
  const [dbc] = await Promise.all([readDbcAll(dbcId)])
  const [tags, tests] = await Promise.all([
    readTagsPrimaryFiltered(dbc?.tagIds ?? null),
    readTestsPrimaryFiltered(dbc?.testIds ?? null)
  ])
  return {
    dbcId,
    tags,
    dbc,
    tests
  }
}

function DbcRouteInner({
  loaderData: { dbcId, tags: initialTags, dbc: initialDbc, tests: initialTests }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()

  const [tags, setTags] = React.useState<TagPrimary[] | null>(initialTags)
  const [dbc, setDbc] = React.useState<DbcAll | null>(initialDbc)
  const [tests, setTests] = React.useState<TestPrimary[] | null>(initialTests)

  const tagIds = React.useMemo(() => dbc?.tagIds ?? null, [dbc])
  const testIds = React.useMemo(() => dbc?.testIds ?? null, [dbc])

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useDbcSubscription('ALL_PROPS', dbcId, setDbc)
  useTestsFilteredSubscription('PRIMARY_PROPS', testIds, setTests)

  React.useEffect(() => {
    if (dbcId === null) {
      notifier.showError(
        'указан некорректный идентификатор базовой конфигурации в URL'
      )
    } else if (
      dbc === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_DBC')
    ) {
      notifier.showError(
        `не удалось загрузить базовую конфигурацию с идентификатором ${dbcId}`
      )
    }
  }, [dbcId, dbc, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DBC') === false ? (
    <ForbiddenScreen />
  ) : dbcId !== null && dbc !== null ? (
    <DbcViewer key={dbcId} tags={tags} dbc={dbc} tests={tests} />
  ) : null
}

export default function DbcRoute(props: Route.ComponentProps) {
  return <DbcRouteInner key={props.loaderData.dbcId} {...props} />
}
