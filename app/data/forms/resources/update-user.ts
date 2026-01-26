// Project
import type {
  DescriptionTextUndefinedWrapDto,
  EmailUndefinedWrapDto,
  ForenameUndefinedWrapDto,
  LoginWrapDto,
  PatronymicUndefinedWrapDto,
  PhoneUndefinedWrapDto,
  RoleIdUndefinedWrapDto,
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

export type UpdateUserFormData = DtoWithoutEnums<
  LoginWrapDto &
    RoleIdUndefinedWrapDto &
    SurnameUndefinedWrapDto &
    ForenameUndefinedWrapDto &
    PatronymicUndefinedWrapDto &
    PhoneUndefinedWrapDto &
    EmailUndefinedWrapDto &
    DescriptionTextUndefinedWrapDto
>

export type UpdateUserFormKey = FormKey<UpdateUserFormData>

export type UpdateUserFormVal = FormVal<UpdateUserFormData>

export type UpdateUserFormErrors = FormValidatorErrors<UpdateUserFormData>

export type UpdateUserFormErrorsJoined =
  FormValidatorErrorsJoined<UpdateUserFormData>

export const updateUserFormValidator = new FormValidator<UpdateUserFormData>({
  oneField: {
    login: {
      transforms: ['TRIM'],
      rules: ['NOT_EMPTY_STR', 'LOGIN']
    },
    roleId: {
      transforms: ['EMPTY_STR_TO_UNDEFINED'],
      rules: ['NOT_UNDEFINED']
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
