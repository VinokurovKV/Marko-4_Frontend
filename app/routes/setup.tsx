// Project
import { serverConnector } from '~/server-connector'
import { LateSetupScreen } from '~/components/screens/problem/late-setup'
import { LoadErrorScreen } from '~/components/screens/problem/load-error'
import { SetupScreen } from '~/components/screens/setup'
// React router
import type { Route } from './+types/setup'
import { useNavigate } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  try {
    return await serverConnector.readMeta()
  } catch {
    return 'LOAD_ERROR'
  }
}

export default function SetupRoute({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate()

  const handleSuccessSetup = React.useCallback(() => {
    void navigate('/login')
  }, [navigate])

  return loaderData === 'LOAD_ERROR' ? (
    <LoadErrorScreen />
  ) : loaderData.setup ? (
    <LateSetupScreen />
  ) : (
    <SetupScreen onSuccessSetup={handleSuccessSetup} />
  )
}
