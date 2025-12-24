// Project
import { serverConnector } from '~/server-connector'

// Read many

export function readDevicesPrimary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DEVICE')
    ? serverConnector
        .readDevices({
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDevicesSecondary() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DEVICE')
    ? serverConnector
        .readDevices({
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read many filtered

export function readDevicesPrimaryFiltered(deviceIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DEVICE') &&
    deviceIds !== null
    ? serverConnector
        .readDevices({
          ids: deviceIds,
          scope: 'PRIMARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDevicesSecondaryFiltered(deviceIds: number[] | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DEVICE') &&
    deviceIds !== null
    ? serverConnector
        .readDevices({
          ids: deviceIds,
          scope: 'UP_TO_SECONDARY_PROPS'
        })
        .catch(() => null)
    : Promise.resolve(null)
}

// Read one

export function readDevicePrimary(deviceId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DEVICE') &&
    deviceId !== null
    ? serverConnector
        .readDevice(
          {
            id: deviceId
          },
          {
            scope: 'PRIMARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDeviceSecondary(deviceId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DEVICE') &&
    deviceId !== null
    ? serverConnector
        .readDevice(
          {
            id: deviceId
          },
          {
            scope: 'UP_TO_SECONDARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDeviceTertiary(deviceId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DEVICE') &&
    deviceId !== null
    ? serverConnector
        .readDevice(
          {
            id: deviceId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readDeviceAll(deviceId: number | null) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DEVICE') &&
    deviceId !== null
    ? serverConnector
        .readDevice(
          {
            id: deviceId
          },
          {
            scope: 'ALL_PROPS'
          }
        )
        .catch(() => null)
    : Promise.resolve(null)
}

// Read version

export function readDeviceVersion(
  params: {
    id: number
    transitionNum: number
  } | null
) {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_DEVICE') &&
    params !== null
    ? serverConnector.readDeviceVersion(params).catch(() => null)
    : Promise.resolve(null)
}
