// Project
import type { RequirementModifier } from '@common/enums'

export const localizationForRequirementModifier = new Map<
  RequirementModifier,
  string
>([
  ['MUST', 'обязательное (must)'],
  ['SHOULD', 'рекомендуемое (should)'],
  ['MAY', 'необязательное (may)']
])
