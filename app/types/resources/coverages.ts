import type {
  CoveragesFilterDto,
  ReadCoverageWithPrimaryPropsSuccessResultDto,
  ReadCoverageWithUpToSecondaryPropsSuccessResultDto,
  ReadCoverageWithUpToTertiaryPropsSuccessResultDto,
  ReadCoverageWithAllPropsSuccessResultDto,
  ReadCoverageVersionSuccessResultDto
} from '@common/dtos/server-api/coverages.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type CoveragesFilter = DtoWithoutEnums<CoveragesFilterDto>
export type CoveragePrimary =
  DtoWithoutEnums<ReadCoverageWithPrimaryPropsSuccessResultDto>
export type CoverageSecondary =
  DtoWithoutEnums<ReadCoverageWithUpToSecondaryPropsSuccessResultDto>
export type CoverageTertiary =
  DtoWithoutEnums<ReadCoverageWithUpToTertiaryPropsSuccessResultDto>
export type CoverageAll =
  DtoWithoutEnums<ReadCoverageWithAllPropsSuccessResultDto>
export type CoverageVersion =
  DtoWithoutEnums<ReadCoverageVersionSuccessResultDto>
