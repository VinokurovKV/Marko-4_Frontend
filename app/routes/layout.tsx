// Project
import { Layout } from '~/components/layout/layout'
// React router
import { Outlet } from 'react-router'

export default function LayoutRoute() {
  return <Layout>{<Outlet />}</Layout>
}
