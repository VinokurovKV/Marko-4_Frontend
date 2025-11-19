// Project
import { serverConnector } from '~/server-connector'
import { LoginScreen } from '~/components/screens/login'
// React router
import { redirect } from 'react-router'

export async function clientLoader() {
  await serverConnector.connect()
  const status = serverConnector.meta.status
  if (status === 'AUTHENTICATED') {
    return redirect('/')
  }
}

export default function LoginRoute() {
  return <LoginScreen />
}
