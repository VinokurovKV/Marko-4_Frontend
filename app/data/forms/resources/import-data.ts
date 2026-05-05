// Project
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import type { ImportBodyMainDto } from '@common/dtos/server-api/import.dto'
import {
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type ImportDataFormData = DtoWithoutEnums<
  ImportBodyMainDto & {
    config?: File
  }
>

export const INITIAL_IMPORT_DATA_FORM_DATA: ImportDataFormData = {
  config: undefined,
  importAllByDefault: false,
  importExistingResourceMode: 'IGNORE',
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

export type ImportDataFormErrors = FormValidatorErrors<ImportDataFormData>

export type ImportDataFormErrorsJoined =
  FormValidatorErrorsJoined<ImportDataFormData>

export const importDataFormValidator = new FormValidator<ImportDataFormData>({
  oneField: {
    config: {
      rules: ['NOT_UNDEFINED', 'ZIP_EXT']
    }
  }
})
