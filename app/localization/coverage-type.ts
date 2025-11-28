// Project
import type { CoverageType } from '@common/enums'

export const localizationForCoverageType = new Map<CoverageType, string>([
  ['FULL', 'все требования'],
  ['MUST_AND_SHOULD', 'обязательные и рекомендуемые требования'],
  ['ONLY_MUST', 'только обязательные требования']
])
