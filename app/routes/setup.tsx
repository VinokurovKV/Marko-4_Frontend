// Project
import { serverConnector } from '~/server-connector'
import { LateSetupScreen } from '~/components/screens/problem/late-setup'
import { LoadErrorScreen } from '~/components/screens/problem/load-error'
// React router
import type { Route } from './+types/setup'

export async function clientLoader() {
  try {
    return await serverConnector.readMeta()
  } catch {
    return 'LOAD_ERROR'
  }
}

export default function Setup({ loaderData }: Route.ComponentProps) {
  return loaderData === 'LOAD_ERROR' ? (
    <LoadErrorScreen />
  ) : loaderData.setup ? (
    <LateSetupScreen />
  ) : (
    <div>
      <h1>Setup</h1>
    </div>
  )
}
