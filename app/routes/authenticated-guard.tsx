// Project
import { serverConnector } from '~/server-connector'
import { useMeta } from '~/providers/meta'
// React router
import { redirect, useNavigate, Outlet } from 'react-router'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const status = serverConnector.meta.status
  if (status === 'NOT_AUTHENTICATED') {
    return redirect('/login')
  }
}

export default function AuthenticatedGuardRoute() {
  const navigate = useNavigate()
  const meta = useMeta()

  React.useEffect(() => {
    if (meta.status === 'NOT_AUTHENTICATED') {
      void navigate('/login')
    }
  }, [navigate, meta])

  return <Outlet />
}
