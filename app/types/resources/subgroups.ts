import type {
  ReadSubgroupWithPrimaryPropsSuccessResultDto,
  ReadSubgroupWithUpToSecondaryPropsSuccessResultDto,
  ReadSubgroupWithUpToTertiaryPropsSuccessResultDto,
  ReadSubgroupWithAllPropsSuccessResultDto,
  ReadSubgroupVersionSuccessResultDto
} from '@common/dtos/server-api/subgroups.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type SubgroupPrimary =
  DtoWithoutEnums<ReadSubgroupWithPrimaryPropsSuccessResultDto>
export type SubgroupSecondary =
  DtoWithoutEnums<ReadSubgroupWithUpToSecondaryPropsSuccessResultDto>
export type SubgroupTertiary =
  DtoWithoutEnums<ReadSubgroupWithUpToTertiaryPropsSuccessResultDto>
export type SubgroupAll =
  DtoWithoutEnums<ReadSubgroupWithAllPropsSuccessResultDto>
export type SubgroupVersion =
  DtoWithoutEnums<ReadSubgroupVersionSuccessResultDto>
