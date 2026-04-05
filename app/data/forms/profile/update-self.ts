// Project
import type {
  DescriptionTextUndefinedWrapDto,
  EmailUndefinedWrapDto,
  ForenameUndefinedWrapDto,
  LoginWrapDto,
  PatronymicUndefinedWrapDto,
  PhoneUndefinedWrapDto,
  SurnameUndefinedWrapDto
} from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type UpdateSelfFormData = DtoWithoutEnums<
  LoginWrapDto &
    SurnameUndefinedWrapDto &
    ForenameUndefinedWrapDto &
    PatronymicUndefinedWrapDto &
    PhoneUndefinedWrapDto &
    EmailUndefinedWrapDto &
    DescriptionTextUndefinedWrapDto
>

export type UpdateSelfFormKey = FormKey<UpdateSelfFormData>

export type UpdateSelfFormVal = FormVal<UpdateSelfFormData>

export type UpdateSelfFormErrors = FormValidatorErrors<UpdateSelfFormData>

export type UpdateSelfFormErrorsJoined =
  FormValidatorErrorsJoined<UpdateSelfFormData>

export const updateSelfFormValidator = new FormValidator<UpdateSelfFormData>({
  oneField: {
    login: {
      transforms: ['TRIM'],
      rules: ['NOT_EMPTY_STR', 'LOGIN']
    },
    surname: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'SURNAME']
    },
    forename: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'FORENAME']
    },
    patronymic: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'PATRONYMIC']
    },
    phone: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'PHONE']
    },
    email: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'EMAIL']
    },
    descriptionText: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'TEXT']
    }
  }
})
