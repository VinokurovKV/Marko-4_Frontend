// Project
import type { Right, VersionedResourceTypePlural } from '@common/enums'
import {
  allVersionedResourceTypePlurals,
  versionResourceTypeFromPlural
} from '@common/enums'
import { serverConnector } from '~/server-connector'
import { useMeta } from '~/providers/meta'
import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
import { TransitionViewer } from '~/components/single-viewers/transition'
// React router
import type { Route } from './+types/history-transition'
// Other
import * as changeCase from 'change-case'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const resourceType = (() => {
    const resourceTypeConstant = changeCase.constantCase(
      params.resource
    ) as VersionedResourceTypePlural
    return allVersionedResourceTypePlurals.includes(resourceTypeConstant)
      ? resourceTypeConstant
      : undefined
  })()
  const resourceId =
    params.resourceId !== undefined
      ? (() => {
          const parsed = parseInt(params.resourceId)
          return parsed === undefined || isNaN(parsed) ? undefined : parsed
        })()
      : undefined
  const transitionNum = (() => {
    const parsed =
      params.transitionNum !== undefined
        ? parseInt(params.transitionNum)
        : undefined
    return parsed === undefined || isNaN(parsed) ? undefined : parsed
  })()
  //
  await serverConnector.connect()
  const [transition, version] =
    resourceType === undefined ||
    resourceId === undefined ||
    transitionNum === undefined
      ? [null, null]
      : await Promise.all(
          (() => {
            const transitionParams = {
              id: resourceId
            }
            const transitionExtra = {
              transitionNums: [transitionNum]
            }
            const versionParams = {
              id: resourceId,
              transitionNum: transitionNum
            }
            switch (resourceType) {
              case 'ROLES':
                return [
                  serverConnector
                    .readRoleTransitions(transitionParams, transitionExtra)
                    .then((tr) => tr[0]),
                  serverConnector
                    .readRoleVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'USERS':
                return [
                  serverConnector
                    .readUserTransitions(transitionParams, transitionExtra)
                    .then((tr) => tr[0]),
                  serverConnector
                    .readUserVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'TAGS':
                return [
                  serverConnector
                    .readTagTransitions(transitionParams, transitionExtra)
                    .then((tr) => tr[0]),
                  serverConnector
                    .readTagVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'DOCUMENTS':
                return [
                  serverConnector
                    .readDocumentTransitions(transitionParams, transitionExtra)
                    .then((tr) => tr[0]),
                  serverConnector
                    .readDocumentVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'FRAGMENTS':
                return [
                  serverConnector
                    .readFragmentTransitions(transitionParams, transitionExtra)
                    .then((tr) => tr[0]),
                  serverConnector
                    .readFragmentVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'REQUIREMENTS':
                return [
                  serverConnector
                    .readRequirementTransitions(
                      transitionParams,
                      transitionExtra
                    )
                    .then((tr) => tr[0]),
                  serverConnector
                    .readRequirementVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'COMMON_TOPOLOGIES':
                return [
                  serverConnector
                    .readCommonTopologyTransitions(
                      transitionParams,
                      transitionExtra
                    )
                    .then((tr) => tr[0]),
                  serverConnector
                    .readCommonTopologyVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'TOPOLOGIES':
                return [
                  serverConnector
                    .readTopologyTransitions(transitionParams, transitionExtra)
                    .then((tr) => tr[0]),
                  serverConnector
                    .readTopologyVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'DBCS':
                return [
                  serverConnector
                    .readDbcTransitions(transitionParams, transitionExtra)
                    .then((tr) => tr[0]),
                  serverConnector
                    .readDbcVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'TEST_TEMPLATES':
                return [
                  serverConnector
                    .readTestTemplateTransitions(
                      transitionParams,
                      transitionExtra
                    )
                    .then((tr) => tr[0]),
                  serverConnector
                    .readTestTemplateVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'TESTS':
                return [
                  serverConnector
                    .readTestTransitions(transitionParams, transitionExtra)
                    .then((tr) => tr[0]),
                  serverConnector
                    .readTestVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'SUBGROUPS':
                return [
                  serverConnector
                    .readSubgroupTransitions(transitionParams, transitionExtra)
                    .then((tr) => tr[0]),
                  serverConnector
                    .readSubgroupVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'GROUPS':
                return [
                  serverConnector
                    .readGroupTransitions(transitionParams, transitionExtra)
                    .then((tr) => tr[0]),
                  serverConnector
                    .readGroupVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'DEVICES':
                return [
                  serverConnector
                    .readDeviceTransitions(transitionParams, transitionExtra)
                    .then((tr) => tr[0]),
                  serverConnector
                    .readDeviceVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'TASKS':
                return [
                  serverConnector
                    .readTaskTransitions(transitionParams, transitionExtra)
                    .then((tr) => tr[0]),
                  serverConnector
                    .readTaskVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
              case 'TASK_TEMPLATES':
                return [
                  serverConnector
                    .readTaskTemplateTransitions(
                      transitionParams,
                      transitionExtra
                    )
                    .then((tr) => tr[0]),
                  serverConnector
                    .readTaskTemplateVersion(versionParams)
                    .then((v) => v.version)
                    .catch(() => 'NOT FOUND')
                ]
            }
          })()
        )
  return {
    resourceType,
    resourceId,
    transitionNum,
    transition,
    version
  }
}

export default function HistoryTransitionRoute({
  loaderData: { resourceType, resourceId, transitionNum, transition, version }
}: Route.ComponentProps) {
  const meta = useMeta()

  return meta.status === 'AUTHENTICATED' &&
    [
      'READ_ROLE',
      'READ_USER',
      'READ_TAG',
      'READ_DOCUMENT',
      'READ_FRAGMENT',
      'READ_REQUIREMENT',
      'READ_COMMON_TOPOLOGY',
      'READ_TOPOLOGY',
      'READ_DSEF',
      'READ_DBC',
      'READ_TEST_TEMPLATE',
      'READ_TEST',
      'READ_SUBGROUP',
      'READ_GROUP',
      'READ_DEVICE',
      'READ_TASK',
      'READ_TASK_TEMPLATE'
    ].some(
      (right) => meta.selfMeta.rights.includes(right as Right) === false
    ) ? (
    <ForbiddenScreen />
  ) : resourceType !== undefined &&
    resourceId !== undefined &&
    transitionNum !== undefined &&
    transition !== null ? (
    <TransitionViewer
      resourceType={versionResourceTypeFromPlural[resourceType]}
      resourceId={resourceId}
      transitionNum={transitionNum}
      transition={transition}
      version={version}
    />
  ) : null
}
