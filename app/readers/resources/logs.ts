// Project
import { ReturnTypeEnum } from '@common/enums'
import { serverConnector } from '~/server-connector'

const DEFAULT_SYSTEM_LOGS_TAKE = 500

export function readApiSystemLogs() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_LOGS')
    ? serverConnector
        .readApiLogs({
          returnType: ReturnTypeEnum.JSON,
          take: DEFAULT_SYSTEM_LOGS_TAKE,
          idSelect: true,
          timeSelect: true,
          methodTypeSelect: true,
          successSelect: true,
          userIdSelect: true,
          userLoginAtTheMomentSelect: true,
          ipSelect: true,
          statusCodeSelect: true,
          pathSelect: true,
          durationMsSelect: true
        })
        .then((logs) =>
          logs.sort((first, second) => {
            const firstTime =
              first.time !== undefined ? new Date(first.time).getTime() : 0
            const secondTime =
              second.time !== undefined ? new Date(second.time).getTime() : 0
            return secondTime - firstTime
          })
        )
        .catch(() => null)
    : Promise.resolve(null)
}

export function readStorageSystemLogs() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_LOGS')
    ? serverConnector
        .readStorageLogs({
          returnType: ReturnTypeEnum.JSON,
          take: DEFAULT_SYSTEM_LOGS_TAKE,
          idSelect: true,
          timeSelect: true,
          successSelect: true,
          internalStorageErrorSelect: true,
          methodNameSelect: true,
          requestSelect: true,
          errorReasonsTypesSelect: true,
          errorReasonsFullSelect: true
        })
        .then((logs) =>
          logs.sort((first, second) => {
            const firstTime =
              first.time !== undefined ? new Date(first.time).getTime() : 0
            const secondTime =
              second.time !== undefined ? new Date(second.time).getTime() : 0
            return secondTime - firstTime
          })
        )
        .catch(() => null)
    : Promise.resolve(null)
}
