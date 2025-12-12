import type {
  ReadTaskWithPrimaryPropsSuccessResultDto,
  ReadTaskWithUpToSecondaryPropsSuccessResultDto,
  ReadTaskWithUpToTertiaryPropsSuccessResultDto,
  ReadTaskWithAllPropsSuccessResultDto,
  ReadTaskVersionSuccessResultDto
} from '@common/dtos/server-api/tasks.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type TaskPrimary =
  DtoWithoutEnums<ReadTaskWithPrimaryPropsSuccessResultDto>
export type TaskSecondary =
  DtoWithoutEnums<ReadTaskWithUpToSecondaryPropsSuccessResultDto>
export type TaskTertiary =
  DtoWithoutEnums<ReadTaskWithUpToTertiaryPropsSuccessResultDto>
export type TaskAll = DtoWithoutEnums<ReadTaskWithAllPropsSuccessResultDto>
export type TaskVersion = DtoWithoutEnums<ReadTaskVersionSuccessResultDto>
