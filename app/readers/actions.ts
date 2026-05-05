// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readActionInfos() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_ACTION')
    ? serverConnector
        .readActionInfos({
          sortOrder: 'NEW_TO_OLD',
          take: 1000
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readAction(actionId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_ACTION') &&
    actionId !== null
    ? serverConnector
        .readAction({
          id: actionId
        })
        .catch(() => null)
    : Promise.resolve(null)
}
