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

export type CreateSliceFormData = DtoWithoutEnums<
  CodeWrapDto &
    NameUndefinedNullWrapDto &
    MinCreateTimeUndefinedNullWrapDto &
    MaxCreateTimeUndefinedNullWrapDto &
    DescriptionTextUndefinedWrapDto &
    RemarkTextUndefinedWrapDto
>

export type CreateSliceFormKey = FormKey<CreateSliceFormData>

export type CreateSliceFormVal = FormVal<CreateSliceFormData>

export const INITIAL_CREATE_SLICE_FORM_DATA: CreateSliceFormData = {
  code: ''
}

export type CreateSliceFormErrors = FormValidatorErrors<CreateSliceFormData>

export type CreateSliceFormErrorsJoined =
  FormValidatorErrorsJoined<CreateSliceFormData>

export const createSliceFormValidator = new FormValidator<CreateSliceFormData>({
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
