// Project
import type { DocumentType } from '@common/enums'

export const localizationForDocumentType = new Map<DocumentType, string>([
  ['MAIN', 'основной'],
  ['OTHER', 'другой'],
  ['STANDARD', 'стандарт'],
  ['TECHNICAL_SPECIFICATION', 'техническая спецификация']
])
