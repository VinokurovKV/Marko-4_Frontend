// Project
import type { CodeWrapDto, DescriptionTextUndefinedWrapDto } from '@common/dtos'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type CreateTagFormData = CodeWrapDto & DescriptionTextUndefinedWrapDto

export type CreateTagFormKey = FormKey<CreateTagFormData>

export type CreateTagFormVal = FormVal<CreateTagFormData>

export const INITIAL_CREATE_TAG_FORM_DATA: CreateTagFormData = {
  code: ''
}

export type CreateTagFormErrors = FormValidatorErrors<CreateTagFormData>

export type CreateTagFormErrorsJoined =
  FormValidatorErrorsJoined<CreateTagFormData>

export const createTagFormValidator = new FormValidator<CreateTagFormData>({
  oneField: {
    code: {
      transforms: ['TRIM'],
      rules: ['NOT_EMPTY_STR', 'CODE']
    },
    descriptionText: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'TEXT']
    }
  }
})
