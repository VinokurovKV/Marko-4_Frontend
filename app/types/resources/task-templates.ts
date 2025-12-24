import type {
  TaskTemplatesFilterDto,
  ReadTaskTemplateWithPrimaryPropsSuccessResultDto,
  ReadTaskTemplateWithUpToSecondaryPropsSuccessResultDto,
  ReadTaskTemplateWithUpToTertiaryPropsSuccessResultDto,
  ReadTaskTemplateWithAllPropsSuccessResultDto,
  ReadTaskTemplateVersionSuccessResultDto
} from '@common/dtos/server-api/task-templates.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type TaskTemplatesFilter = DtoWithoutEnums<TaskTemplatesFilterDto>
export type TaskTemplatePrimary =
  DtoWithoutEnums<ReadTaskTemplateWithPrimaryPropsSuccessResultDto>
export type TaskTemplateSecondary =
  DtoWithoutEnums<ReadTaskTemplateWithUpToSecondaryPropsSuccessResultDto>
export type TaskTemplateTertiary =
  DtoWithoutEnums<ReadTaskTemplateWithUpToTertiaryPropsSuccessResultDto>
export type TaskTemplateAll =
  DtoWithoutEnums<ReadTaskTemplateWithAllPropsSuccessResultDto>
export type TaskTemplateVersion =
  DtoWithoutEnums<ReadTaskTemplateVersionSuccessResultDto>
