// Project
import { useMeta } from '~/providers/meta'
import { NotConnectedScreen } from '~/components/screens/problem/not-connected'
// React router
import { Outlet } from 'react-router'

export default function ConnectedGuardRoute() {
  const meta = useMeta()
  return meta.status === 'NOT_CONNECTED' ? <NotConnectedScreen /> : <Outlet />
}
