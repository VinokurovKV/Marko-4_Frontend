// Project
import { serverConnector } from '~/server-connector'
import { LoadErrorScreen } from '~/components/screens/problem/load-error'
import { LoginScreen } from '~/components/screens/login'
// React router
import type { Route } from './+types/login'
import { redirect, useNavigate } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  try {
    const meta = await serverConnector.readMeta()
    if (meta.setup === false) {
      return redirect('/setup')
    } else if (serverConnector.authorized()) {
      return redirect('/index')
    }
  } catch {
    return 'LOAD_ERROR'
  }
}

export default function LoginRoute({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate()

  const handleSuccessLogin = React.useCallback(() => {
    void navigate('/')
  }, [navigate])

  return loaderData === 'LOAD_ERROR' ? (
    <LoadErrorScreen />
  ) : (
    <LoginScreen onSuccessLogin={handleSuccessLogin} />
  )
}
