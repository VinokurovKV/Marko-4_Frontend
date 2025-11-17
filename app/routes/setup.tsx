// Project
import { useDelay } from '~/hooks/use-delay'
import { useMeta } from '~/providers/meta'
import { LateSetupScreen } from '~/components/screens/problem/late-setup'
import { SetupScreen } from '~/components/screens/setup'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'

export default function SetupRoute() {
  const meta = useDelay(useMeta())
  const navigate = useNavigate()

  const handleSuccessSetup = React.useCallback(() => {
    void navigate('/login')
  }, [navigate])

  return meta.status === 'NOT_AUTHENTICATED' ||
    meta.status === 'AUTHENTICATED' ? (
    <LateSetupScreen />
  ) : (
    <SetupScreen onSuccessSetup={handleSuccessSetup} />
  )
}
