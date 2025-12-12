import type {
  ReadTaskReportWithPrimaryPropsSuccessResultDto,
  ReadTaskReportWithUpToSecondaryPropsSuccessResultDto,
  ReadTaskReportWithUpToTertiaryPropsSuccessResultDto,
  ReadTaskReportWithAllPropsSuccessResultDto
} from '@common/dtos/server-api/task-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type TaskReportPrimary =
  DtoWithoutEnums<ReadTaskReportWithPrimaryPropsSuccessResultDto>
export type TaskReportSecondary =
  DtoWithoutEnums<ReadTaskReportWithUpToSecondaryPropsSuccessResultDto>
export type TaskReportTertiary =
  DtoWithoutEnums<ReadTaskReportWithUpToTertiaryPropsSuccessResultDto>
export type TaskReportAll =
  DtoWithoutEnums<ReadTaskReportWithAllPropsSuccessResultDto>
