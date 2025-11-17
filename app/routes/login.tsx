// Project
import { serverConnector } from '~/server-connector'
import { LoginScreen } from '~/components/screens/login'
// React router
import { redirect, useNavigate } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const status = serverConnector.meta.status
  if (status === 'AUTHENTICATED') {
    return redirect('/')
  }
}

export default function LoginRoute() {
  const navigate = useNavigate()

  const handleSuccessLogin = React.useCallback(() => {
    void navigate('/')
  }, [navigate])

  return <LoginScreen onSuccessLogin={handleSuccessLogin} />
}
