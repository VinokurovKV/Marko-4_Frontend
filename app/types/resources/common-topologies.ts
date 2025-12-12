import type { CommonTopologyConfigDto } from '@common/dtos'
import type {
  ReadCommonTopologyWithPrimaryPropsSuccessResultDto,
  ReadCommonTopologyWithUpToSecondaryPropsSuccessResultDto,
  ReadCommonTopologyWithUpToTertiaryPropsSuccessResultDto,
  ReadCommonTopologyWithAllPropsSuccessResultDto,
  ReadCommonTopologyVersionSuccessResultDto
} from '@common/dtos/server-api/common-topologies.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type CommonTopologyConfig = DtoWithoutEnums<CommonTopologyConfigDto>
export type CommonTopologyPrimary =
  DtoWithoutEnums<ReadCommonTopologyWithPrimaryPropsSuccessResultDto>
export type CommonTopologySecondary =
  DtoWithoutEnums<ReadCommonTopologyWithUpToSecondaryPropsSuccessResultDto>
export type CommonTopologyTertiary =
  DtoWithoutEnums<ReadCommonTopologyWithUpToTertiaryPropsSuccessResultDto>
export type CommonTopologyAll =
  DtoWithoutEnums<ReadCommonTopologyWithAllPropsSuccessResultDto>
export type CommonTopologyVersion =
  DtoWithoutEnums<ReadCommonTopologyVersionSuccessResultDto>
