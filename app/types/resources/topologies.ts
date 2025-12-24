import type {
  TopologiesFilterDto,
  ReadTopologyWithPrimaryPropsSuccessResultDto,
  ReadTopologyWithUpToSecondaryPropsSuccessResultDto,
  ReadTopologyWithUpToTertiaryPropsSuccessResultDto,
  ReadTopologyWithAllPropsSuccessResultDto,
  ReadTopologyVersionSuccessResultDto
} from '@common/dtos/server-api/topologies.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type TopologiesFilter = DtoWithoutEnums<TopologiesFilterDto>
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
