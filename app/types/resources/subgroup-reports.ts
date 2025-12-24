import type {
  SubgroupReportsFilterDto,
  ReadSubgroupReportWithPrimaryPropsSuccessResultDto,
  ReadSubgroupReportWithUpToSecondaryPropsSuccessResultDto,
  ReadSubgroupReportWithUpToTertiaryPropsSuccessResultDto,
  ReadSubgroupReportWithAllPropsSuccessResultDto
} from '@common/dtos/server-api/subgroup-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type SubgroupReportsFilter = DtoWithoutEnums<SubgroupReportsFilterDto>
export type SubgroupReportPrimary =
  DtoWithoutEnums<ReadSubgroupReportWithPrimaryPropsSuccessResultDto>
export type SubgroupReportSecondary =
  DtoWithoutEnums<ReadSubgroupReportWithUpToSecondaryPropsSuccessResultDto>
export type SubgroupReportTertiary =
  DtoWithoutEnums<ReadSubgroupReportWithUpToTertiaryPropsSuccessResultDto>
export type SubgroupReportAll =
  DtoWithoutEnums<ReadSubgroupReportWithAllPropsSuccessResultDto>
