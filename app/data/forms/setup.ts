import {
  OwnerRoleNameWrapDto,
  OwnerLoginWrapDto,
  OwnerPassWrapDto,
  AutoTesterRoleNameWrapDto,
  AutoTesterLoginWrapDto,
  AutoTesterPassWrapDto
} from '@common/dtos'

export type SetupFormData = OwnerRoleNameWrapDto &
  OwnerLoginWrapDto &
  OwnerPassWrapDto &
  AutoTesterRoleNameWrapDto &
  AutoTesterLoginWrapDto &
  AutoTesterPassWrapDto
