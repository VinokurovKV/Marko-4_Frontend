import type {
  ReadTopologyWithPrimaryPropsSuccessResultDto,
  ReadTopologyWithUpToSecondaryPropsSuccessResultDto,
  ReadTopologyWithUpToTertiaryPropsSuccessResultDto,
  ReadTopologyWithAllPropsSuccessResultDto,
  ReadTopologyVersionSuccessResultDto
} from '@common/dtos/server-api/topologies.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type TopologyPrimary =
  DtoWithoutEnums<ReadTopologyWithPrimaryPropsSuccessResultDto>
export type TopologySecondary =
  DtoWithoutEnums<ReadTopologyWithUpToSecondaryPropsSuccessResultDto>
export type TopologyTertiary =
  DtoWithoutEnums<ReadTopologyWithUpToTertiaryPropsSuccessResultDto>
export type TopologyAll =
  DtoWithoutEnums<ReadTopologyWithAllPropsSuccessResultDto>
export type TopologyVersion =
  DtoWithoutEnums<ReadTopologyVersionSuccessResultDto>
