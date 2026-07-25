import type {
  ReadApiLogsSuccessResultItemDto,
  ReadStorageLogsSuccessResultItemDto
} from '@common/dtos/server-api/logs.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type ApiSystemLog = DtoWithoutEnums<ReadApiLogsSuccessResultItemDto>

export type StorageSystemLog =
  DtoWithoutEnums<ReadStorageLogsSuccessResultItemDto> & {
    internalStorageError?: boolean
    methodName?: string
    errorReasonsTypes?: string[]
  }

export type SystemLog =
  | ({ logType: 'API' } & ApiSystemLog)
  | ({ logType: 'STORAGE' } & StorageSystemLog)
