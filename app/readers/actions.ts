// Project
import { serverConnector } from '~/server-connector'

// Read many

export const ACTION_INFOS_READ_PARAMS = {
  sortOrder: 'NEW_TO_OLD',
  take: 1000
} as const

export function readActionInfos() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_ACTION')
    ? serverConnector
        .readActionInfos(ACTION_INFOS_READ_PARAMS)
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
