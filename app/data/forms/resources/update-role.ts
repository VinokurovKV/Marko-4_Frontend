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

export type UpdateRoleFormData = DtoWithoutEnums<
  NameWrapDto & RightsUndefinedWrapDto & DescriptionTextUndefinedWrapDto
>

export type UpdateRoleFormKey = FormKey<UpdateRoleFormData>

export type UpdateRoleFormVal = FormVal<UpdateRoleFormData>

export type UpdateRoleFormErrors = FormValidatorErrors<UpdateRoleFormData>

export type UpdateRoleFormErrorsJoined =
  FormValidatorErrorsJoined<UpdateRoleFormData>

export const updateRoleFormValidator = new FormValidator<UpdateRoleFormData>({
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
