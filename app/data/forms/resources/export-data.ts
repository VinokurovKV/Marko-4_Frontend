// Project
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import type { ExportQueryDto } from '@common/dtos/server-api/export.dto'

export type ExportDataFormData = DtoWithoutEnums<ExportQueryDto>

export const INITIAL_EXPORT_DATA_FORM_DATA: ExportDataFormData = {
  exportAllByDefault: false,
  includeLinksToNotExportedResources: true,
  includeUserCredentials: false,
  roles: true,
  users: true,
  tags: true,
  documents: true,
  fragments: true,
  requirements: true,
  commonTopologies: true,
  topologies: true,
  dbcs: true,
  testTemplates: true,
  tests: true,
  subgroups: true,
  groups: true,
  devices: true
}
