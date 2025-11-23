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
      transforms: ['TRIM'],
      rules: ['SURNAME']
    },
    forename: {
      transforms: ['TRIM'],
      rules: ['FORENAME']
    },
    patronymic: {
      transforms: ['TRIM'],
      rules: ['PATRONYMIC']
    },
    phone: {
      transforms: ['TRIM'],
      rules: ['PHONE']
    },
    email: {
      transforms: ['TRIM'],
      rules: ['EMAIL']
    },
    descriptionText: {
      rules: ['TEXT']
    }
  },
  manyFields: [['EQUAL_PASSES', 'pass', 'passConfirm']]
})
