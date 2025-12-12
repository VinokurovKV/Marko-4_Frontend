import type {
  ReadFragmentWithPrimaryPropsSuccessResultDto,
  ReadFragmentWithUpToSecondaryPropsSuccessResultDto,
  ReadFragmentWithUpToTertiaryPropsSuccessResultDto,
  ReadFragmentWithAllPropsSuccessResultDto,
  ReadFragmentVersionSuccessResultDto
} from '@common/dtos/server-api/fragments.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type FragmentPrimary =
  DtoWithoutEnums<ReadFragmentWithPrimaryPropsSuccessResultDto>
export type FragmentSecondary =
  DtoWithoutEnums<ReadFragmentWithUpToSecondaryPropsSuccessResultDto>
export type FragmentTertiary =
  DtoWithoutEnums<ReadFragmentWithUpToTertiaryPropsSuccessResultDto>
export type FragmentAll =
  DtoWithoutEnums<ReadFragmentWithAllPropsSuccessResultDto>
export type FragmentVersion =
  DtoWithoutEnums<ReadFragmentVersionSuccessResultDto>
