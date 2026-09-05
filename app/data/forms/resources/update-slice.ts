// Project
import type {
  CodeWrapDto,
  DescriptionTextUndefinedWrapDto,
  MaxCreateTimeUndefinedNullWrapDto,
  MinCreateTimeUndefinedNullWrapDto,
  NameUndefinedNullWrapDto,
  RemarkTextUndefinedWrapDto
} from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type UpdateSliceFormData = DtoWithoutEnums<
  CodeWrapDto &
    NameUndefinedNullWrapDto &
    MinCreateTimeUndefinedNullWrapDto &
    MaxCreateTimeUndefinedNullWrapDto &
    DescriptionTextUndefinedWrapDto &
    RemarkTextUndefinedWrapDto
>

export type UpdateSliceFormKey = FormKey<UpdateSliceFormData>

export type UpdateSliceFormVal = FormVal<UpdateSliceFormData>

export type UpdateSliceFormErrors = FormValidatorErrors<UpdateSliceFormData>

export type UpdateSliceFormErrorsJoined =
  FormValidatorErrorsJoined<UpdateSliceFormData>

export const updateSliceFormValidator = new FormValidator<UpdateSliceFormData>({
  oneField: {
    code: {
      transforms: ['TRIM'],
      rules: ['NOT_EMPTY_STR', 'CODE']
    },
    name: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'NAME']
    },
    descriptionText: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'TEXT']
    },
    remarkText: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'TEXT']
    }
  }
})
