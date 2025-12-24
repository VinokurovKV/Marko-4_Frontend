import type {
  TestReportsFilterDto,
  ReadTestReportWithPrimaryPropsSuccessResultDto,
  ReadTestReportWithUpToSecondaryPropsSuccessResultDto,
  ReadTestReportWithUpToTertiaryPropsSuccessResultDto,
  ReadTestReportWithAllPropsSuccessResultDto
} from '@common/dtos/server-api/test-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type TestReportsFilter = DtoWithoutEnums<TestReportsFilterDto>
export type TestReportPrimary =
  DtoWithoutEnums<ReadTestReportWithPrimaryPropsSuccessResultDto>
export type TestReportSecondary =
  DtoWithoutEnums<ReadTestReportWithUpToSecondaryPropsSuccessResultDto>
export type TestReportTertiary =
  DtoWithoutEnums<ReadTestReportWithUpToTertiaryPropsSuccessResultDto>
export type TestReportAll =
  DtoWithoutEnums<ReadTestReportWithAllPropsSuccessResultDto>
