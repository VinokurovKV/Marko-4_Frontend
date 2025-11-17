// Project
import { serverConnector } from '~/server-connector'
// React router
import { redirect, Outlet } from 'react-router'

export async function clientLoader() {
  await serverConnector.connect()
  const status = serverConnector.meta.status
  if (status === 'NOT_SETUP') {
    return redirect('/setup')
  }
}

export default function SetupGuardRoute() {
  return <Outlet />
}
