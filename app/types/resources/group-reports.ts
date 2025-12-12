import type {
  ReadGroupReportWithPrimaryPropsSuccessResultDto,
  ReadGroupReportWithUpToSecondaryPropsSuccessResultDto,
  ReadGroupReportWithUpToTertiaryPropsSuccessResultDto,
  ReadGroupReportWithAllPropsSuccessResultDto
} from '@common/dtos/server-api/group-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type GroupReportPrimary =
  DtoWithoutEnums<ReadGroupReportWithPrimaryPropsSuccessResultDto>
export type GroupReportSecondary =
  DtoWithoutEnums<ReadGroupReportWithUpToSecondaryPropsSuccessResultDto>
export type GroupReportTertiary =
  DtoWithoutEnums<ReadGroupReportWithUpToTertiaryPropsSuccessResultDto>
export type GroupReportAll =
  DtoWithoutEnums<ReadGroupReportWithAllPropsSuccessResultDto>
