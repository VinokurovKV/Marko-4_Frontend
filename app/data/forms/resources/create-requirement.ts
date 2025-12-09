// Project
import type {
  BigCodeWrapDto,
  BigNameUndefinedWrapDto,
  ChildRequirementIdsUndefinedWrapDto,
  DescriptionTextUndefinedWrapDto,
  FragmentIdsUndefinedWrapDto,
  ParentRequirementIdsUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
  RequirementModifierUndefinedWrapDto,
  RequirementOriginUndefinedWrapDto,
  TagIdsUndefinedWrapDto
} from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type CreateRequirementFormData = DtoWithoutEnums<
  BigCodeWrapDto &
    BigNameUndefinedWrapDto &
    RequirementModifierUndefinedWrapDto &
    RequirementOriginUndefinedWrapDto &
    FragmentIdsUndefinedWrapDto &
    ParentRequirementIdsUndefinedWrapDto &
    ChildRequirementIdsUndefinedWrapDto &
    DescriptionTextUndefinedWrapDto &
    TagIdsUndefinedWrapDto & {
      tagCodesToCreate?: string[]
    } & RemarkTextUndefinedWrapDto
>

export type CreateRequirementFormKey = FormKey<CreateRequirementFormData>

export type CreateRequirementFormVal = FormVal<CreateRequirementFormData>

export const INITIAL_CREATE_REQUIREMENT_FORM_DATA: CreateRequirementFormData = {
  code: ''
}

export type CreateRequirementFormErrors =
  FormValidatorErrors<CreateRequirementFormData>

export type CreateRequirementFormErrorsJoined =
  FormValidatorErrorsJoined<CreateRequirementFormData>

export const createRequirementFormValidator =
  new FormValidator<CreateRequirementFormData>({
    oneField: {
      code: {
        transforms: ['TRIM'],
        rules: ['NOT_EMPTY_STR', 'BIG_CODE']
      },
      name: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
        rules: ['ALLOW_UNDEFINED', 'BIG_NAME']
      },
      modifier: {
        transforms: ['EMPTY_STR_TO_UNDEFINED'],
        rules: ['NOT_UNDEFINED']
      },
      origin: {
        transforms: ['EMPTY_STR_TO_UNDEFINED'],
        rules: ['NOT_UNDEFINED']
      },
      fragmentIds: {
        transforms: ['EMPTY_ARR_TO_UNDEFINED']
      },
      parentRequirementIds: {
        transforms: ['EMPTY_ARR_TO_UNDEFINED']
      },
      childRequirementIds: {
        transforms: ['EMPTY_ARR_TO_UNDEFINED']
      },
      descriptionText: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
        rules: ['ALLOW_UNDEFINED', 'TEXT']
      },
      tagIds: {
        transforms: ['EMPTY_ARR_TO_UNDEFINED']
      },
      tagCodesToCreate: {
        rules: ['AUTOCOMPLETE_FREE_ITEMS'],
        transforms: ['EMPTY_ARR_TO_UNDEFINED']
      },
      remarkText: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
        rules: ['ALLOW_UNDEFINED', 'TEXT']
      }
    }
  })
