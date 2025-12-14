// Project
import type { RequirementOrigin } from '@common/enums'

export const localizationForRequirementOrigin = new Map<
  RequirementOrigin,
  string
>([
  ['PICS_PROFORMA', 'PICS Proforma'],
  ['SECTION', 'раздел'],
  ['STANDARD_SECTION', 'раздел стандарта'],
  ['TECHNICAL_SPECIFICATION', 'техническая спецификация'],
  ['OTHER', 'другое']
])
