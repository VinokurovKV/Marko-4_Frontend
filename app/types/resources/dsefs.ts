import type {
  DsefsFilterDto,
  ReadDsefWithPrimaryPropsSuccessResultDto,
  ReadDsefWithUpToSecondaryPropsSuccessResultDto,
  ReadDsefWithUpToTertiaryPropsSuccessResultDto,
  ReadDsefWithAllPropsSuccessResultDto,
  ReadDsefVersionSuccessResultDto
} from '@common/dtos/server-api/dsefs.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type DsefsFilter = DtoWithoutEnums<DsefsFilterDto>
export type DsefPrimary =
  DtoWithoutEnums<ReadDsefWithPrimaryPropsSuccessResultDto>
export type DsefSecondary =
  DtoWithoutEnums<ReadDsefWithUpToSecondaryPropsSuccessResultDto>
export type DsefTertiary =
  DtoWithoutEnums<ReadDsefWithUpToTertiaryPropsSuccessResultDto>
export type DsefAll = DtoWithoutEnums<ReadDsefWithAllPropsSuccessResultDto>
export type DsefVersion = DtoWithoutEnums<ReadDsefVersionSuccessResultDto>
