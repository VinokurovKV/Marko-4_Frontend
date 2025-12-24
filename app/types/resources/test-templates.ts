import type {
  TestTemplatesFilterDto,
  ReadTestTemplateWithPrimaryPropsSuccessResultDto,
  ReadTestTemplateWithUpToSecondaryPropsSuccessResultDto,
  ReadTestTemplateWithUpToTertiaryPropsSuccessResultDto,
  ReadTestTemplateWithAllPropsSuccessResultDto,
  ReadTestTemplateVersionSuccessResultDto
} from '@common/dtos/server-api/test-templates.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type TestTemplatesFilter = DtoWithoutEnums<TestTemplatesFilterDto>
export type TestTemplatePrimary =
  DtoWithoutEnums<ReadTestTemplateWithPrimaryPropsSuccessResultDto>
export type TestTemplateSecondary =
  DtoWithoutEnums<ReadTestTemplateWithUpToSecondaryPropsSuccessResultDto>
export type TestTemplateTertiary =
  DtoWithoutEnums<ReadTestTemplateWithUpToTertiaryPropsSuccessResultDto>
export type TestTemplateAll =
  DtoWithoutEnums<ReadTestTemplateWithAllPropsSuccessResultDto>
export type TestTemplateVersion =
  DtoWithoutEnums<ReadTestTemplateVersionSuccessResultDto>
