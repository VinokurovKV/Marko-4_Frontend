// Project
import type { CodeWrapDto, DescriptionTextUndefinedWrapDto } from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type UpdateTagFormData = DtoWithoutEnums<
  CodeWrapDto & DescriptionTextUndefinedWrapDto
>

export type UpdateTagFormKey = FormKey<UpdateTagFormData>

export type UpdateTagFormVal = FormVal<UpdateTagFormData>

export type UpdateTagFormErrors = FormValidatorErrors<UpdateTagFormData>

export type UpdateTagFormErrorsJoined =
  FormValidatorErrorsJoined<UpdateTagFormData>

export const updateTagFormValidator = new FormValidator<UpdateTagFormData>({
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
