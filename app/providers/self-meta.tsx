// Project
import { ServerConnectorUnauthorizedError } from '~/server-connector/error'
import type { ServerConnector } from '~/server-connector'
import { serverConnector } from '~/server-connector'
// React
import * as React from 'react'

export async function clientLoader() {
  await serverConnector.connect()
  const selfMeta = serverConnector.authorized()
    ? await serverConnector.readSelfMeta()
    : null
  return selfMeta
}

type SelfMetaContextType = Awaited<
  ReturnType<ServerConnector['readSelfMeta']>
> | null

const SelfMetaContext = React.createContext<SelfMetaContextType>(null)

export const useSelfMeta = () => {
  return React.useContext(SelfMetaContext)
}

type InitializeStatus = 'WAITING' | 'SUCCESS' | 'ERROR'

export function SelfMetaProvider({ children }: { children: React.ReactNode }) {
  const [initializeStatus, setInitializeStatus] =
    React.useState<InitializeStatus>('WAITING')
  const [selfMeta, setSelfMeta] = React.useState<SelfMetaContextType>(null)

  React.useEffect(() => {
    const updateSelfMeta = async () => {
      try {
        const selfMeta = await serverConnector.readSelfMeta()
        setInitializeStatus((oldStatus) =>
          oldStatus === 'WAITING' ? 'SUCCESS' : oldStatus
        )
        setSelfMeta(selfMeta)
      } catch (error) {
        if (error instanceof ServerConnectorUnauthorizedError) {
          setInitializeStatus((oldStatus) =>
            oldStatus === 'WAITING' ? 'SUCCESS' : oldStatus
          )
          setSelfMeta(null)
        } else {
          setInitializeStatus((oldStatus) =>
            oldStatus === 'WAITING' ? 'ERROR' : oldStatus
          )
        }
      }
    }
    void (async () => {
      await updateSelfMeta()
    })()
    const subscriptionId = serverConnector.subscribeToSelfMeta(() => {
      void updateSelfMeta()
    }).subscriptionId
    return () => {
      void serverConnector.unsubscribe(subscriptionId)
    }
  }, [setInitializeStatus, setSelfMeta])

  return initializeStatus === 'WAITING' ? null : initializeStatus ===
    'ERROR' ? (
    <div>Проблема при обращении к серверу. Попробуйте обновить страницу</div>
  ) : (
    <SelfMetaContext.Provider value={selfMeta}>
      {children}
    </SelfMetaContext.Provider>
  )
}
