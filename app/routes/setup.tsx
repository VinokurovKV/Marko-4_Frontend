// Project
import { useDelay } from '~/hooks/use-delay'
import { useMeta } from '~/providers/meta'
import { LateSetupScreen } from '~/components/screens/problem/late-setup'
import { SetupScreen } from '~/components/screens/setup'

export default function SetupRoute() {
  const meta = useDelay(useMeta())

  return meta.status === 'NOT_AUTHENTICATED' ||
    meta.status === 'AUTHENTICATED' ? (
    <LateSetupScreen />
  ) : (
    <SetupScreen />
  )
}
