// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readFragmentsPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_FRAGMENT')
    ? serverConnector
        .readFragments({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readFragmentsSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_FRAGMENT')
    ? serverConnector
        .readFragments({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readFragmentsPrimaryFiltered(fragmentIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_FRAGMENT') &&
    fragmentIds !== null
    ? serverConnector
        .readFragments({
          ids: fragmentIds,
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readFragmentsSecondaryFiltered(fragmentIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_FRAGMENT') &&
    fragmentIds !== null
    ? serverConnector
        .readFragments({
          ids: fragmentIds,
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readFragmentPrimary(fragmentId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_FRAGMENT') &&
    fragmentId !== null
    ? serverConnector
        .readFragment(
          {
            id: fragmentId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readFragmentSecondary(fragmentId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_FRAGMENT') &&
    fragmentId !== null
    ? serverConnector
        .readFragment(
          {
            id: fragmentId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readFragmentTertiary(fragmentId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_FRAGMENT') &&
    fragmentId !== null
    ? serverConnector
        .readFragment(
          {
            id: fragmentId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readFragmentAll(fragmentId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_FRAGMENT') &&
    fragmentId !== null
    ? serverConnector
        .readFragment(
          {
            id: fragmentId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readFragmentVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_FRAGMENT') &&
    params !== null
    ? serverConnector.readFragmentVersion(params).catch(() => null)
    : Promise.resolve(null)
}
