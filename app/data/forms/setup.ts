// Project
import type {
  OwnerLoginWrapDto,
  OwnerPassConfirmWrapDto,
  OwnerPassWrapDto
} from '@common/dtos'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type SetupFormData = OwnerLoginWrapDto &
  OwnerPassWrapDto &
  OwnerPassConfirmWrapDto

export type SetupFormKey = FormKey<SetupFormData>

export type SetupFormVal = FormVal<SetupFormData>

export const INITIAL_SETUP_FORM_DATA: SetupFormData = {
  ownerLogin: '',
  ownerPass: '',
  ownerPassConfirm: ''
}

export type SetupFormErrors = FormValidatorErrors<SetupFormData>

export type SetupFormErrorsJoined = FormValidatorErrorsJoined<SetupFormData>

export const setupFormValidator = new FormValidator<SetupFormData>({
  oneField: {
    ownerLogin: {
      transforms: ['TRIM'],
      rules: ['NOT_EMPTY_STR', 'LOGIN']
    },
    ownerPass: {
      rules: ['NOT_EMPTY_STR', 'PASS']
    },
    ownerPassConfirm: {
      rules: ['NOT_EMPTY_STR']
    }
  },
  manyFields: [['EQUAL_PASSES', 'ownerPass', 'ownerPassConfirm']]
})
