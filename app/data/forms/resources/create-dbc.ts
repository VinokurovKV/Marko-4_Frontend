// Project
import type {
  CodeWrapDto,
  DescriptionTextUndefinedWrapDto,
  NameUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
  TagIdsUndefinedWrapDto
} from '@common/dtos'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type CreateDbcFormData = CodeWrapDto &
  NameUndefinedWrapDto & {
    config?: File
  } & DescriptionTextUndefinedWrapDto &
  TagIdsUndefinedWrapDto & {
    tagCodesToCreate?: string[]
  } & RemarkTextUndefinedWrapDto

export type CreateDbcFormKey = FormKey<CreateDbcFormData>

export type CreateDbcFormVal = FormVal<CreateDbcFormData>

export const INITIAL_CREATE_DBC_FORM_DATA: CreateDbcFormData = {
  code: ''
}

export type CreateDbcFormErrors = FormValidatorErrors<CreateDbcFormData>

export type CreateDbcFormErrorsJoined =
  FormValidatorErrorsJoined<CreateDbcFormData>

export const createDbcFormValidator = new FormValidator<CreateDbcFormData>({
  oneField: {
    code: {
      transforms: ['TRIM'],
      rules: ['NOT_EMPTY_STR', 'CODE']
    },
    name: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'NAME']
    },
    config: {
      rules: ['ALLOW_UNDEFINED', 'ZIP_EXT']
    },
    descriptionText: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'TEXT']
    },
    tagIds: {
      transforms: ['EMPTY_ARR_TO_UNDEFINED']
    },
    tagCodesToCreate: {
      transforms: ['EMPTY_ARR_TO_UNDEFINED']
    },
    remarkText: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'TEXT']
    }
  }
})
