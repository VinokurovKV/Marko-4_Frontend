// Project
import { serverConnector } from '~/server-connector'
import type { RequirementsFilter } from '~/types'

// Read many

export function readRequirementsPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT')
    ? serverConnector
        .readRequirements({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readRequirementsSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT')
    ? serverConnector
        .readRequirements({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readRequirementsPrimaryFiltered(
  requirementIds?: number[] | null,
  extraFilter?: RequirementsFilter
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT') &&
    requirementIds !== null
    ? serverConnector
        .readRequirements({
          ids: requirementIds,
          ...extraFilter,
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readRequirementsSecondaryFiltered(
  requirementIds?: number[] | null,
  extraFilter?: RequirementsFilter
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT') &&
    requirementIds !== null
    ? serverConnector
        .readRequirements({
          ids: requirementIds,
          ...extraFilter,
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readRequirementPrimary(requirementId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT') &&
    requirementId !== null
    ? serverConnector
        .readRequirement(
          {
            id: requirementId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readRequirementSecondary(requirementId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT') &&
    requirementId !== null
    ? serverConnector
        .readRequirement(
          {
            id: requirementId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readRequirementTertiary(requirementId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT') &&
    requirementId !== null
    ? serverConnector
        .readRequirement(
          {
            id: requirementId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readRequirementAll(requirementId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT') &&
    requirementId !== null
    ? serverConnector
        .readRequirement(
          {
            id: requirementId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readRequirementVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_REQUIREMENT') &&
    params !== null
    ? serverConnector.readRequirementVersion(params).catch(() => null)
    : Promise.resolve(null)
}
