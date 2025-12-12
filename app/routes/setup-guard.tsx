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
  if (status === 'NOT_SETUP') {
    return redirect('/setup')
  }
}

export default function SetupGuardRoute() {
  const navigate = useNavigate()
  const meta = useMeta()

  React.useEffect(() => {
    if (meta.status === 'NOT_SETUP') {
      void navigate('/setup')
    }
  }, [navigate, meta])

  return <Outlet />
}
