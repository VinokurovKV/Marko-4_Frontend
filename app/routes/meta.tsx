// Project
import { serverConnector } from '~/server-connector'
import { MetaProvider } from '~/providers/meta'
// React router
import { Outlet } from 'react-router'

export async function clientLoader() {
  await serverConnector.connect()
}

export default function MetaRoute() {
  return <MetaProvider>{<Outlet />}</MetaProvider>
}
