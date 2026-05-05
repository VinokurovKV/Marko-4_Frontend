// Project
import type { VersionedResourceTypePlural } from '@common/enums'
import { serverConnector } from '~/server-connector'

export function readTransitions(
  resourceTypePlural: VersionedResourceTypePlural,
  resourceId: number
) {
  const meta = serverConnector.meta
  const params = {
    id: resourceId
  }
  const extra = { sortOrder: 'NEW_TO_OLD' as const }
  return meta.status === 'AUTHENTICATED'
    ? (() => {
        switch (resourceTypePlural) {
          case 'ROLES':
            return serverConnector.readRoleTransitions(params, extra)
          case 'USERS':
            return serverConnector.readUserTransitions(params, extra)
          case 'TAGS':
            return serverConnector.readTagTransitions(params, extra)
          case 'DOCUMENTS':
            return serverConnector.readDocumentTransitions(params, extra)
          case 'FRAGMENTS':
            return serverConnector.readFragmentTransitions(params, extra)
          case 'REQUIREMENTS':
            return serverConnector.readRequirementTransitions(params, extra)
          case 'COMMON_TOPOLOGIES':
            return serverConnector.readCommonTopologyTransitions(params, extra)
          case 'TOPOLOGIES':
            return serverConnector.readTopologyTransitions(params, extra)
          case 'DBCS':
            return serverConnector.readDbcTransitions(params, extra)
          case 'TEST_TEMPLATES':
            return serverConnector.readTestTemplateTransitions(params, extra)
          case 'TESTS':
            return serverConnector.readTestTransitions(params, extra)
          case 'SUBGROUPS':
            return serverConnector.readSubgroupTransitions(params, extra)
          case 'GROUPS':
            return serverConnector.readGroupTransitions(params, extra)
          case 'DEVICES':
            return serverConnector.readDeviceTransitions(params, extra)
          case 'TASKS':
            return serverConnector.readTaskTransitions(params, extra)
          case 'TASK_TEMPLATES':
            return serverConnector.readTaskTemplateTransitions(params, extra)
        }
      })().catch(() => null)
    : Promise.resolve(null)
}
