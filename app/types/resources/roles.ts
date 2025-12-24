import type {
  RolesFilterDto,
  ReadRoleWithPrimaryPropsSuccessResultDto,
  ReadRoleWithUpToSecondaryPropsSuccessResultDto,
  ReadRoleWithUpToTertiaryPropsSuccessResultDto,
  ReadRoleWithAllPropsSuccessResultDto,
  ReadRoleVersionSuccessResultDto
} from '@common/dtos/server-api/roles.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type RolesFilter = DtoWithoutEnums<RolesFilterDto>
export type RolePrimary =
  DtoWithoutEnums<ReadRoleWithPrimaryPropsSuccessResultDto>
export type RoleSecondary =
  DtoWithoutEnums<ReadRoleWithUpToSecondaryPropsSuccessResultDto>
export type RoleTertiary =
  DtoWithoutEnums<ReadRoleWithUpToTertiaryPropsSuccessResultDto>
export type RoleAll = DtoWithoutEnums<ReadRoleWithAllPropsSuccessResultDto>
export type RoleVersion = DtoWithoutEnums<ReadRoleVersionSuccessResultDto>
