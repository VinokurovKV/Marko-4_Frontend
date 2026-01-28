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
  RequirementRateWrapDto,
  TagIdsUndefinedWrapDto,
  TestIdUndefinedWrapDto
} from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type UpdateRequirementFormData = DtoWithoutEnums<
  BigCodeWrapDto &
    BigNameUndefinedWrapDto &
    RequirementModifierUndefinedWrapDto &
    RequirementOriginUndefinedWrapDto &
    RequirementRateWrapDto &
    FragmentIdsUndefinedWrapDto &
    ParentRequirementIdsUndefinedWrapDto &
    ChildRequirementIdsUndefinedWrapDto &
    TestIdUndefinedWrapDto &
    DescriptionTextUndefinedWrapDto &
    TagIdsUndefinedWrapDto & {
      tagCodesToCreate?: string[]
    } & RemarkTextUndefinedWrapDto
>

export type UpdateRequirementFormKey = FormKey<UpdateRequirementFormData>

export type UpdateRequirementFormVal = FormVal<UpdateRequirementFormData>

export type UpdateRequirementFormErrors =
  FormValidatorErrors<UpdateRequirementFormData>

export type UpdateRequirementFormErrorsJoined =
  FormValidatorErrorsJoined<UpdateRequirementFormData>

export const updateRequirementFormValidator =
  new FormValidator<UpdateRequirementFormData>({
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
      rate: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED', 'STR_TO_NUM'],
        rules: ['NOT_UNDEFINED', 'INT_POSITIVE']
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
      testId: {
        transforms: ['EMPTY_STR_TO_UNDEFINED']
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
