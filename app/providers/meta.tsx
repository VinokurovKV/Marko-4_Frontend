// Project
import type { Right } from '@common/enums'
import { serverConnector } from '~/server-connector'
// React
import * as React from 'react'

// TODO: need to subscribe to server connector instead of polling

const POLLING_INTERVAL = 200

interface SelfMetaExtended {
  id: number
  login: string
  rights: Right[]
  rightsSet: Set<Right>
}

export type Meta =
  | {
      status: 'NOT_CONNECTED' | 'NOT_SETUP' | 'NOT_AUTHENTICATED'
    }
  | {
      status: 'AUTHENTICATED'
      selfMeta: SelfMetaExtended
    }

const NOT_CONNECTED_META: Meta = {
  status: 'NOT_CONNECTED'
}

function metasAreEqual(meta_1: Meta, meta_2: Meta) {
  const status_1 = meta_1.status
  const status_2 = meta_2.status
  return (
    status_1 === status_2 &&
    (status_1 !== 'AUTHENTICATED' ||
      status_2 !== 'AUTHENTICATED' ||
      JSON.stringify([
        meta_1.selfMeta.id,
        meta_1.selfMeta.login,
        meta_1.selfMeta.rights
      ]) ===
        JSON.stringify([
          meta_2.selfMeta.id,
          meta_2.selfMeta.login,
          meta_2.selfMeta.rights
        ]))
  )
}

const MetaContext = React.createContext<Meta>(NOT_CONNECTED_META)

export const useMeta = () => {
  return React.useContext(MetaContext)
}

export function MetaProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = React.useState(false)
  const [meta, setMeta] = React.useState<Meta>(NOT_CONNECTED_META)

  const updateSelfMeta = React.useCallback(async () => {
    try {
      const selfMeta = await serverConnector.readSelfMeta()
      const newMeta: Meta = {
        status: 'AUTHENTICATED',
        selfMeta: {
          ...selfMeta,
          rightsSet: new Set(selfMeta.rights)
        }
      }
      setMeta((oldMeta) => {
        return metasAreEqual(newMeta, oldMeta) ? oldMeta : newMeta
      })
    } catch {
      if (serverConnector.meta.status !== 'AUTHENTICATED') {
        const newMeta: Meta = {
          status: serverConnector.meta.status
        }
        setMeta((oldMeta) => {
          return metasAreEqual(newMeta, oldMeta) ? oldMeta : newMeta
        })
      }
    }
    setInitialized(true)
  }, [setInitialized, setMeta])

  React.useEffect(() => {
    void (async () => {
      await updateSelfMeta()
    })()
  }, [updateSelfMeta])

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToSelfMeta(() => {
      void updateSelfMeta()
    }).subscriptionId
    return () => {
      void serverConnector.unsubscribe(subscriptionId)
    }
  }, [updateSelfMeta])

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setMeta((oldMeta) => {
        const status = serverConnector.meta.status
        if (status !== 'AUTHENTICATED') {
          return status !== oldMeta.status ? { status } : oldMeta
        } else if (
          oldMeta.status !== 'AUTHENTICATED' &&
          serverConnector.meta.selfMeta !== null
        ) {
          const selfMeta = serverConnector.meta.selfMeta
          return {
            status: 'AUTHENTICATED',
            selfMeta: {
              ...selfMeta,
              rightsSet: new Set(selfMeta.rights)
            }
          }
        } else {
          return oldMeta
        }
      })
    }, POLLING_INTERVAL)
    return () => {
      clearInterval(intervalId)
    }
  }, [setMeta])

  return initialized === false ? null : (
    <MetaContext.Provider value={meta}>{children}</MetaContext.Provider>
  )
}
