// Project
import type {
  MyCurrentPassWrapDto,
  NewPassConfirmWrapDto,
  NewPassWrapDto
} from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type UpdateSelfPassFormData = DtoWithoutEnums<
  MyCurrentPassWrapDto & NewPassWrapDto & NewPassConfirmWrapDto
>

export const INITIAL_UPDATE_SELF_PASS_FORM_DATA: UpdateSelfPassFormData = {
  myCurrentPass: '',
  newPass: '',
  newPassConfirm: ''
}

export type UpdateSelfPassFormKey = FormKey<UpdateSelfPassFormData>

export type UpdateSelfPassFormVal = FormVal<UpdateSelfPassFormData>

export type UpdateSelfPassFormErrors =
  FormValidatorErrors<UpdateSelfPassFormData>

export type UpdateSelfPassFormErrorsJoined =
  FormValidatorErrorsJoined<UpdateSelfPassFormData>

export const updateSelfPassFormValidator =
  new FormValidator<UpdateSelfPassFormData>({
    oneField: {
      myCurrentPass: {
        rules: ['NOT_EMPTY_STR']
      },
      newPass: {
        rules: ['NOT_EMPTY_STR', 'PASS']
      },
      newPassConfirm: {
        rules: ['NOT_EMPTY_STR']
      }
    },
    manyFields: [['EQUAL_PASSES', 'newPass', 'newPassConfirm']]
  })
