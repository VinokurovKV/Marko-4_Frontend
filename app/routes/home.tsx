// Project
import { serverConnector } from '~/server-connector'
import { SelfMetaProvider } from '~/providers/self-meta'
import { LoadErrorScreen } from '~/components/screens/problem/load-error'
// React router
import type { Route } from './+types/home'
import { redirect } from 'react-router'

export async function clientLoader() {
  try {
    const meta = await serverConnector.readMeta()
    if (meta.setup === false) {
      return redirect('/setup')
    } else if (serverConnector.authorized() === false) {
      return redirect('/login')
    }
  } catch {
    return 'LOAD_ERROR'
  }
}

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return loaderData === 'LOAD_ERROR' ? (
    <LoadErrorScreen />
  ) : (
    <SelfMetaProvider>
      <div>
        <h1>Home</h1>
      </div>
    </SelfMetaProvider>
  )
}
