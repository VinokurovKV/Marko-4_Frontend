// Project
import type { LoginWrapDto, PassWrapDto } from '@common/dtos'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

// TODO: make an opportunity to exit system automatically when session is ended

export type LoginFormData = LoginWrapDto & PassWrapDto

export type LoginFormKey = FormKey<LoginFormData>

export type LoginFormVal = FormVal<LoginFormData>

export const INITIAL_LOGIN_FORM_DATA: LoginFormData = {
  login: '',
  pass: ''
}

export type LoginFormErrors = FormValidatorErrors<LoginFormData>

export type LoginFormErrorsJoined = FormValidatorErrorsJoined<LoginFormData>

export const loginFormValidator = new FormValidator<LoginFormData>({
  oneField: {
    login: {
      transforms: ['TRIM'],
      rules: ['NOT_EMPTY_STR', 'LOGIN']
    },
    pass: {
      rules: ['NOT_EMPTY_STR', 'PASS']
    }
  }
})
