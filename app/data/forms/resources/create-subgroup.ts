// Project
import type {
  BigCodeWrapDto,
  BigNameUndefinedWrapDto,
  DescriptionTextUndefinedWrapDto,
  GroupIdUndefinedWrapDto,
  NumInGroupUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
  TagIdsUndefinedWrapDto,
  TestIdsUndefinedWrapDto
} from '@common/dtos'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type CreateSubgroupFormData = BigCodeWrapDto &
  BigNameUndefinedWrapDto &
  TestIdsUndefinedWrapDto &
  GroupIdUndefinedWrapDto &
  NumInGroupUndefinedWrapDto &
  DescriptionTextUndefinedWrapDto &
  TagIdsUndefinedWrapDto & {
    tagCodesToCreate?: string[]
  } & RemarkTextUndefinedWrapDto

export type CreateSubgroupFormKey = FormKey<CreateSubgroupFormData>

export type CreateSubgroupFormVal = FormVal<CreateSubgroupFormData>

export const INITIAL_CREATE_SUBGROUP_FORM_DATA: CreateSubgroupFormData = {
  code: ''
}

export type CreateSubgroupFormErrors =
  FormValidatorErrors<CreateSubgroupFormData>

export type CreateSubgroupFormErrorsJoined =
  FormValidatorErrorsJoined<CreateSubgroupFormData>

export const createSubgroupFormValidator =
  new FormValidator<CreateSubgroupFormData>({
    oneField: {
      code: {
        transforms: ['TRIM'],
        rules: ['NOT_EMPTY_STR', 'BIG_CODE']
      },
      name: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
        rules: ['ALLOW_UNDEFINED', 'BIG_NAME']
      },
      testIds: {
        transforms: ['EMPTY_ARR_TO_UNDEFINED']
      },
      groupId: {
        transforms: ['EMPTY_STR_TO_UNDEFINED']
      },
      numInGroup: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED', 'STR_TO_NUM'],
        rules: ['ALLOW_UNDEFINED', 'INT_NON_NEGATIVE']
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
