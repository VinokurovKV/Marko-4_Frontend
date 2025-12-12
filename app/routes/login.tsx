// Project
import { serverConnector } from '~/server-connector'
import { useMeta } from '~/providers/meta'
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
  const meta = useMeta()

  React.useEffect(() => {
    if (meta.status === 'AUTHENTICATED') {
      void navigate('/')
    }
  }, [navigate, meta])

  return <LoginScreen />
}
