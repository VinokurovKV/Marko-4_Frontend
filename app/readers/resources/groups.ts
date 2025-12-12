// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readGroupsPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP')
    ? serverConnector
        .readGroups({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readGroupsSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP')
    ? serverConnector
        .readGroups({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readGroupsPrimaryFiltered(groupIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP') &&
    groupIds !== null
    ? groupIds.length === 0
      ? []
      : serverConnector
          .readGroups({
            ids: groupIds,
            scope: 'PRIMARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

export function readGroupsSecondaryFiltered(groupIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP') &&
    groupIds !== null
    ? groupIds.length === 0
      ? []
      : serverConnector
          .readGroups({
            ids: groupIds,
            scope: 'UP_TO_SECONDARY_PROPS'
          })
          .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readGroupPrimary(groupId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP') &&
    groupId !== null
    ? serverConnector
        .readGroup(
          {
            id: groupId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readGroupSecondary(groupId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP') &&
    groupId !== null
    ? serverConnector
        .readGroup(
          {
            id: groupId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readGroupTertiary(groupId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP') &&
    groupId !== null
    ? serverConnector
        .readGroup(
          {
            id: groupId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readGroupAll(groupId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP') &&
    groupId !== null
    ? serverConnector
        .readGroup(
          {
            id: groupId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readGroupVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_GROUP') &&
    params !== null
    ? serverConnector.readGroupVersion(params).catch(() => null)
    : Promise.resolve(null)
}
