// React router
import { redirect } from 'react-router'

export function clientLoader() {
  return redirect('/tasks')
}

export default function HomeRoute() {
  return (
    <div>
      <h1 style={{ marginLeft: 30 }}>Home</h1>
    </div>
  )
}
