// Project
import { serverConnector } from '~/server-connector'
import { HistoryScreen } from '~/components/screens/history'
// React router
import { useOutlet } from 'react-router'

export async function clientLoader() {
  await serverConnector.connect()
  return {}
}

export default function HistoryRoute() {
  const outlet = useOutlet()

  return <HistoryScreen>{outlet !== null ? outlet : null}</HistoryScreen>
}
