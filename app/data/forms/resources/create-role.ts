// Project
import type {
  DescriptionTextUndefinedWrapDto,
  NameWrapDto,
  RightsUndefinedWrapDto
} from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type CreateRoleFormData = NameWrapDto &
  DtoWithoutEnums<RightsUndefinedWrapDto> &
  DescriptionTextUndefinedWrapDto

export type CreateRoleFormKey = FormKey<CreateRoleFormData>

export type CreateRoleFormVal = FormVal<CreateRoleFormData>

export const INITIAL_CREATE_ROLE_FORM_DATA: CreateRoleFormData = {
  name: ''
}

export type CreateRoleFormErrors = FormValidatorErrors<CreateRoleFormData>

export type CreateRoleFormErrorsJoined =
  FormValidatorErrorsJoined<CreateRoleFormData>

export const createRoleFormValidator = new FormValidator<CreateRoleFormData>({
  oneField: {
    name: {
      transforms: ['TRIM'],
      rules: ['NOT_EMPTY_STR', 'NAME']
    },
    rights: {
      transforms: ['EMPTY_ARR_TO_UNDEFINED']
    },
    descriptionText: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'TEXT']
    }
  }
})
