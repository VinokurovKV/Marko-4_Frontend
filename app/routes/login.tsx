// Project
import { serverConnector } from '~/server-connector'
import { LoadErrorScreen } from '~/components/screens/problem/load-error'
// React router
import type { Route } from './+types/login'
import { redirect } from 'react-router'

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

export default function Login({ loaderData }: Route.ComponentProps) {
  return loaderData === 'LOAD_ERROR' ? (
    <LoadErrorScreen />
  ) : (
    <div>
      <h1>Login</h1>
    </div>
  )
}
