// Project
import type {
  DescriptionTextUndefinedWrapDto,
  EmailUndefinedWrapDto,
  ForenameUndefinedWrapDto,
  LoginWrapDto,
  PassConfirmWrapDto,
  PassWrapDto,
  PatronymicUndefinedWrapDto,
  PhoneUndefinedWrapDto,
  RoleIdUndefinedWrapDto,
  SurnameUndefinedWrapDto
} from '@common/dtos'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type CreateUserFormData = LoginWrapDto &
  PassWrapDto &
  PassConfirmWrapDto &
  RoleIdUndefinedWrapDto &
  SurnameUndefinedWrapDto &
  ForenameUndefinedWrapDto &
  PatronymicUndefinedWrapDto &
  PhoneUndefinedWrapDto &
  EmailUndefinedWrapDto &
  DescriptionTextUndefinedWrapDto

export type CreateUserFormKey = FormKey<CreateUserFormData>

export type CreateUserFormVal = FormVal<CreateUserFormData>

export const INITIAL_CREATE_USER_FORM_DATA: CreateUserFormData = {
  login: '',
  pass: '',
  passConfirm: ''
}

export type CreateUserFormErrors = FormValidatorErrors<CreateUserFormData>

export type CreateUserFormErrorsJoined =
  FormValidatorErrorsJoined<CreateUserFormData>

export const createUserFormValidator = new FormValidator<CreateUserFormData>({
  oneField: {
    login: {
      transforms: ['TRIM'],
      rules: ['NOT_EMPTY_STR', 'LOGIN']
    },
    pass: {
      rules: ['NOT_EMPTY_STR', 'PASS']
    },
    passConfirm: {
      rules: ['NOT_EMPTY_STR']
    },
    roleId: {
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
  },
  manyFields: [['EQUAL_PASSES', 'pass', 'passConfirm']]
})
