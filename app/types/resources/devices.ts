import type {
  ReadDeviceWithPrimaryPropsSuccessResultDto,
  ReadDeviceWithUpToSecondaryPropsSuccessResultDto,
  ReadDeviceWithUpToTertiaryPropsSuccessResultDto,
  ReadDeviceWithAllPropsSuccessResultDto,
  ReadDeviceVersionSuccessResultDto
} from '@common/dtos/server-api/devices.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type DevicePrimary =
  DtoWithoutEnums<ReadDeviceWithPrimaryPropsSuccessResultDto>
export type DeviceSecondary =
  DtoWithoutEnums<ReadDeviceWithUpToSecondaryPropsSuccessResultDto>
export type DeviceTertiary =
  DtoWithoutEnums<ReadDeviceWithUpToTertiaryPropsSuccessResultDto>
export type DeviceAll = DtoWithoutEnums<ReadDeviceWithAllPropsSuccessResultDto>
export type DeviceVersion = DtoWithoutEnums<ReadDeviceVersionSuccessResultDto>
