// Project
import { serverConnector } from '~/server-connector'

// Read hierarchy

export function readRequirementsHierarchy() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT')
    ? serverConnector.readRequirementsHierarchy().catch(() => null)
    : Promise.resolve(null)
}

// Read hierarchy vertex

export function readRequirementsHierarchyVertex(requirementId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT') &&
    requirementId !== null
    ? serverConnector
        .readRequirementsHierarchyVertex({
          id: requirementId
        })
        .catch(() => null)
    : Promise.resolve(null)
}
