import type {
  ReadSliceWithPrimaryPropsSuccessResultDto,
  ReadSliceWithUpToSecondaryPropsSuccessResultDto,
  ReadSliceWithUpToTertiaryPropsSuccessResultDto,
  ReadSliceWithAllPropsSuccessResultDto,
  ReadSliceVersionSuccessResultDto
} from '@common/dtos/server-api/slices.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type SlicePrimary =
  DtoWithoutEnums<ReadSliceWithPrimaryPropsSuccessResultDto>
export type SliceSecondary =
  DtoWithoutEnums<ReadSliceWithUpToSecondaryPropsSuccessResultDto>
export type SliceTertiary =
  DtoWithoutEnums<ReadSliceWithUpToTertiaryPropsSuccessResultDto>
export type SliceAll = DtoWithoutEnums<ReadSliceWithAllPropsSuccessResultDto>
export type SliceVersion = DtoWithoutEnums<ReadSliceVersionSuccessResultDto>
