import type {
  ReadTagWithPrimaryPropsSuccessResultDto,
  ReadTagWithUpToSecondaryPropsSuccessResultDto,
  ReadTagWithUpToTertiaryPropsSuccessResultDto,
  ReadTagWithAllPropsSuccessResultDto,
  ReadTagVersionSuccessResultDto
} from '@common/dtos/server-api/tags.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type TagPrimary =
  DtoWithoutEnums<ReadTagWithPrimaryPropsSuccessResultDto>
export type TagSecondary =
  DtoWithoutEnums<ReadTagWithUpToSecondaryPropsSuccessResultDto>
export type TagTertiary =
  DtoWithoutEnums<ReadTagWithUpToTertiaryPropsSuccessResultDto>
export type TagAll = DtoWithoutEnums<ReadTagWithAllPropsSuccessResultDto>
export type TagVersion = DtoWithoutEnums<ReadTagVersionSuccessResultDto>
