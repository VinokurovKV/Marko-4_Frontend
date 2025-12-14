// Project
import type { RequirementPrimary, CoverageSecondary } from '~/types'
import { serverConnector } from '~/server-connector'
import { readRequirementsPrimary, readCoveragesSecondary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useCoveragesSubscription,
  useRequirementsSubscription
} from '~/hooks/resources'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { CoveragesScreen } from '~/components/screens/coverages'
// React router
import type { Route } from './+types/coverages'
import { useOutlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const [requirements, coverages] = await Promise.all([
    readRequirementsPrimary(),
    readCoveragesSecondary()
  ])
  return {
    requirements,
    coverages
  }
}

export default function CoveragesRoute({
  loaderData: { requirements: initialRequirements, coverages: initialCoverages }
}: Route.ComponentProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const outlet = useOutlet()

  const [requirements, setRequirements] = React.useState<
    RequirementPrimary[] | null
  >(initialRequirements)
  const [coverages, setCoverages] = React.useState<CoverageSecondary[] | null>(
    initialCoverages
  )

  useRequirementsSubscription('PRIMARY_PROPS', setRequirements)
  useCoveragesSubscription('UP_TO_SECONDARY_PROPS', setCoverages)

  React.useEffect(() => {
    if (
      coverages === null &&
      serverConnector.meta.status === 'AUTHENTICATED' &&
      serverConnector.meta.selfMeta.rights.includes('READ_COVERAGE')
    ) {
      notifier.showError('не удалось загрузить список покрытий требований')
    }
  }, [coverages, notifier])

  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_COVERAGE') === false ? (
    <ForbiddenScreen />
  ) : coverages !== null ? (
    <CoveragesScreen requirements={requirements} coverages={coverages}>
      {outlet !== null ? outlet : null}
    </CoveragesScreen>
  ) : null
}
