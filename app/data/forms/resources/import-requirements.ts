// Project
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type ImportRequirementsFormData = DtoWithoutEnums<
  {
    config?: File
  } & {
    ignoreExistingRequirements: boolean
  } & {
    ignoreTestIfNotExists: boolean
  } & {
    interruptIfError: boolean
  }
>

export type ImportRequirementsFormKey = FormKey<ImportRequirementsFormData>

export type ImportRequirementsFormVal = FormVal<ImportRequirementsFormData>

export const INITIAL_IMPORT_REQUIREMENTS_FORM_DATA: ImportRequirementsFormData =
  {
    ignoreExistingRequirements: false,
    ignoreTestIfNotExists: false,
    interruptIfError: true
  }

export type ImportRequirementsFormErrors =
  FormValidatorErrors<ImportRequirementsFormData>

export type ImportRequirementsFormErrorsJoined =
  FormValidatorErrorsJoined<ImportRequirementsFormData>

export const importRequirementsFormValidator =
  new FormValidator<ImportRequirementsFormData>({
    oneField: {
      config: {
        rules: ['NOT_UNDEFINED', 'JSON_ZIP_EXT']
      }
    }
  })
