import type {
  DbcsFilterDto,
  ReadDbcWithPrimaryPropsSuccessResultDto,
  ReadDbcWithUpToSecondaryPropsSuccessResultDto,
  ReadDbcWithUpToTertiaryPropsSuccessResultDto,
  ReadDbcWithAllPropsSuccessResultDto,
  ReadDbcVersionSuccessResultDto
} from '@common/dtos/server-api/dbcs.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type DbcsFilter = DtoWithoutEnums<DbcsFilterDto>
export type DbcPrimary =
  DtoWithoutEnums<ReadDbcWithPrimaryPropsSuccessResultDto>
export type DbcSecondary =
  DtoWithoutEnums<ReadDbcWithUpToSecondaryPropsSuccessResultDto>
export type DbcTertiary =
  DtoWithoutEnums<ReadDbcWithUpToTertiaryPropsSuccessResultDto>
export type DbcAll = DtoWithoutEnums<ReadDbcWithAllPropsSuccessResultDto>
export type DbcVersion = DtoWithoutEnums<ReadDbcVersionSuccessResultDto>
