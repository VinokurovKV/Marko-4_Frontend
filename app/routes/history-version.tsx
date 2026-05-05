// Project
import type { Right, VersionedResourceTypePlural } from '@common/enums'
import {
  allVersionedResourceTypePlurals,
  versionResourceTypeFromPlural
} from '@common/enums'
import { serverConnector } from '~/server-connector'
import { readTransitions } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { HistoryVersionScreen } from '~/components/screens/history-version'
// React router
import type { Route } from './+types/history-version'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'
// Other
import * as changeCase from 'change-case'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const resourceType = (() => {
    const resourceTypeConstant = changeCase.constantCase(
      params.resource
    ) as VersionedResourceTypePlural
    return allVersionedResourceTypePlurals.includes(resourceTypeConstant)
      ? resourceTypeConstant
      : undefined
  })()
  const resourceId =
    params.resourceId !== undefined
      ? (() => {
          const parsed = parseInt(params.resourceId)
          return parsed === undefined || isNaN(parsed) ? undefined : parsed
        })()
      : undefined
  //
  await serverConnector.connect()
  const [transitions] =
    resourceType !== undefined && resourceId !== undefined
      ? await Promise.all([readTransitions(resourceType, resourceId)])
      : [null]
  return {
    resourceType,
    resourceId,
    transitions
  }
}

export default function HistoryVersionRoute({
  loaderData: { resourceType, resourceId, transitions }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  React.useEffect(() => {
    if (
      resourceId !== undefined &&
      transitions === null &&
      serverConnector.meta.status === 'AUTHENTICATED'
    ) {
      notifier.showError('не удалось загрузить список переходов')
    }
  }, [transitions, notifier])

  return meta.status === 'AUTHENTICATED' &&
    [
      'READ_ROLE',
      'READ_USER',
      'READ_TAG',
      'READ_DOCUMENT',
      'READ_FRAGMENT',
      'READ_REQUIREMENT',
      'READ_COMMON_TOPOLOGY',
      'READ_TOPOLOGY',
      'READ_DSEF',
      'READ_DBC',
      'READ_TEST_TEMPLATE',
      'READ_TEST',
      'READ_SUBGROUP',
      'READ_GROUP',
      'READ_DEVICE',
      'READ_TASK',
      'READ_TASK_TEMPLATE'
    ].some(
      (right) => meta.selfMeta.rights.includes(right as Right) === false
    ) ? (
    <ForbiddenScreen />
  ) : resourceType !== undefined &&
    resourceId !== undefined &&
    transitions !== null ? (
    <HistoryVersionScreen
      resourceType={versionResourceTypeFromPlural[resourceType]}
      resourceId={resourceId}
      transitions={transitions}
    >
      {outlet !== null ? outlet : null}
    </HistoryVersionScreen>
  ) : null
}
