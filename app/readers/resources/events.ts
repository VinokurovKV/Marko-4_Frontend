// Project
import { serverConnector } from '~/server-connector'

const DEFAULT_EVENTS_TAKE = 1000

export function readEvents() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_EVENT')
    ? serverConnector
        .readEvents({
          sortOrder: 'NEW_TO_OLD',
          take: DEFAULT_EVENTS_TAKE
        })
        .catch(() => null)
    : Promise.resolve(null)
}
