// Project
import { serverConnector } from '~/server-connector'
// React
import * as React from 'react'

export function useBackups(active: boolean = true) {
  const [backups, setBackups] = React.useState<string[]>([])

  const load = React.useCallback(async () => {
    try {
      const loadedBackups = await serverConnector.readBackups()
      setBackups(loadedBackups)
    } catch {
      setBackups([])
    }
  }, [])

  React.useEffect(() => {
    if (active === false) {
      return
    }
    void load()
    const backupSubscriptionId = serverConnector.subscribeToBackups(() => {
      void load()
    }).subscriptionId
    return () => {
      serverConnector.unsubscribe(backupSubscriptionId)
    }
  }, [active, load])

  const reload = React.useCallback(() => {
    void load()
  }, [load])

  return { backups, reload }
}
