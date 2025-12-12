import type {
  ReadRequirementWithPrimaryPropsSuccessResultDto,
  ReadRequirementWithUpToSecondaryPropsSuccessResultDto,
  ReadRequirementWithUpToTertiaryPropsSuccessResultDto,
  ReadRequirementWithAllPropsSuccessResultDto,
  ReadRequirementVersionSuccessResultDto
} from '@common/dtos/server-api/requirements.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type RequirementPrimary =
  DtoWithoutEnums<ReadRequirementWithPrimaryPropsSuccessResultDto>
export type RequirementSecondary =
  DtoWithoutEnums<ReadRequirementWithUpToSecondaryPropsSuccessResultDto>
export type RequirementTertiary =
  DtoWithoutEnums<ReadRequirementWithUpToTertiaryPropsSuccessResultDto>
export type RequirementAll =
  DtoWithoutEnums<ReadRequirementWithAllPropsSuccessResultDto>
export type RequirementVersion =
  DtoWithoutEnums<ReadRequirementVersionSuccessResultDto>
