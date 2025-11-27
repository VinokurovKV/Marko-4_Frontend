// Project
import type { DeviceType } from '@common/enums'

export const localizationForDeviceType = new Map<DeviceType, string>([
  ['ETALON', 'эталонное'],
  ['UNDER_TEST', 'тестируемое'],
  ['HYBRID', 'гибридное']
])
