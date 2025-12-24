import type {
  UsersFilterDto,
  ReadUserWithPrimaryPropsSuccessResultDto,
  ReadUserWithUpToSecondaryPropsSuccessResultDto,
  ReadUserWithUpToTertiaryPropsSuccessResultDto,
  ReadUserWithAllPropsSuccessResultDto,
  ReadUserVersionSuccessResultDto
} from '@common/dtos/server-api/users.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type UsersFilter = DtoWithoutEnums<UsersFilterDto>
export type UserPrimary =
  DtoWithoutEnums<ReadUserWithPrimaryPropsSuccessResultDto>
export type UserSecondary =
  DtoWithoutEnums<ReadUserWithUpToSecondaryPropsSuccessResultDto>
export type UserTertiary =
  DtoWithoutEnums<ReadUserWithUpToTertiaryPropsSuccessResultDto>
export type UserAll = DtoWithoutEnums<ReadUserWithAllPropsSuccessResultDto>
export type UserVersion = DtoWithoutEnums<ReadUserVersionSuccessResultDto>
