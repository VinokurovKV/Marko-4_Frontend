import type {
  ReadGroupWithPrimaryPropsSuccessResultDto,
  ReadGroupWithUpToSecondaryPropsSuccessResultDto,
  ReadGroupWithUpToTertiaryPropsSuccessResultDto,
  ReadGroupWithAllPropsSuccessResultDto,
  ReadGroupVersionSuccessResultDto
} from '@common/dtos/server-api/groups.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type GroupPrimary =
  DtoWithoutEnums<ReadGroupWithPrimaryPropsSuccessResultDto>
export type GroupSecondary =
  DtoWithoutEnums<ReadGroupWithUpToSecondaryPropsSuccessResultDto>
export type GroupTertiary =
  DtoWithoutEnums<ReadGroupWithUpToTertiaryPropsSuccessResultDto>
export type GroupAll = DtoWithoutEnums<ReadGroupWithAllPropsSuccessResultDto>
export type GroupVersion = DtoWithoutEnums<ReadGroupVersionSuccessResultDto>
