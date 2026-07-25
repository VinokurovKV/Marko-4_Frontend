// Project
import { ReturnTypeEnum } from '@common/enums'
import { serverConnector } from '~/server-connector'

const DEFAULT_SYSTEM_LOGS_TAKE = 500

export function readSystemLogs() {
  const meta = serverConnector.meta
  return meta.status === 'AUTHENTICATED' &&
    meta.selfMeta.rights.includes('READ_LOGS')
    ? Promise.allSettled([
        serverConnector.readApiLogs({
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
          durationSelect: true
        }),
        serverConnector.readStorageLogs({
          returnType: ReturnTypeEnum.JSON,
          take: DEFAULT_SYSTEM_LOGS_TAKE,
          idSelect: true,
          timeSelect: true,
          successSelect: true,
          internalStorageErrorSelect: true,
          methodNameSelect: true,
          errorReasonsTypesSelect: true
        })
      ]).then(([apiLogsResult, storageLogsResult]) => {
        if (
          apiLogsResult.status === 'rejected' &&
          storageLogsResult.status === 'rejected'
        ) {
          return null
        }

        const apiLogs =
          apiLogsResult.status === 'fulfilled' ? apiLogsResult.value : []
        const storageLogs =
          storageLogsResult.status === 'fulfilled'
            ? storageLogsResult.value
            : []

        return [
          ...apiLogs.map((log) => ({ ...log, logType: 'API' as const })),
          ...storageLogs.map((log) => ({
            ...log,
            logType: 'STORAGE' as const
          }))
        ].sort((first, second) => {
          const firstTime =
            first.time !== undefined ? new Date(first.time).getTime() : 0
          const secondTime =
            second.time !== undefined ? new Date(second.time).getTime() : 0
          return secondTime - firstTime
        })
      })
    : Promise.resolve(null)
}
