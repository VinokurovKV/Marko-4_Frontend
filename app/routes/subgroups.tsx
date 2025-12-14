// Project
import type { GroupPrimary, SubgroupSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readSubgroupsSecondary, readGroupsPrimary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useSubgroupsSubscription,
  useGroupsSubscription
} from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { SubgroupsScreen } from '~/components/screens/subgroups'
// React router
import type { Route } from './+types/subgroups'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [subgroups, groups] = await Promise.all([
    readSubgroupsSecondary(),
    readGroupsPrimary()
  ])
  return {
    subgroups,
    groups
  }
}

export default function SubgroupsRoute({
  loaderData: { subgroups: initialSubgroups, groups: initialGroups }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [groups, setGroups] = React.useState<GroupPrimary[] | null>(
    initialGroups
  )
  const [subgroups, setSubgroups] = React.useState<SubgroupSecondary[] | null>(
    initialSubgroups
  )

  useGroupsSubscription('PRIMARY_PROPS', setGroups)
  useSubgroupsSubscription('UP_TO_SECONDARY_PROPS', setSubgroups)

  React.useEffect(() => {
    if (
      subgroups === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_SUBGROUP')
    ) {
      notifier.showError('не удалось загрузить список подгрупп тестов')
    }
  }, [subgroups, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_SUBGROUP') === false ? (
    <ForbiddenScreen />
  ) : subgroups !== null ? (
    <SubgroupsScreen subgroups={subgroups} groups={groups}>
      {outlet !== null ? outlet : null}
    </SubgroupsScreen>
  ) : null
}
