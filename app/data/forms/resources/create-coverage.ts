// Project
import type {
  BigCodeWrapDto,
  BigNameUndefinedWrapDto,
  CoveragePercentUndefinedWrapDto,
  CoverageTypeUndefinedWrapDto,
  DescriptionTextUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
  RequirementIdUndefinedWrapDto,
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

export type CreateCoverageFormData = BigCodeWrapDto &
  BigNameUndefinedWrapDto &
  RequirementIdUndefinedWrapDto &
  CoverageTypeUndefinedWrapDto &
  TestIdsUndefinedWrapDto &
  CoveragePercentUndefinedWrapDto &
  DescriptionTextUndefinedWrapDto &
  TagIdsUndefinedWrapDto & {
    tagCodesToCreate?: string[]
  } & RemarkTextUndefinedWrapDto

export type CreateCoverageFormKey = FormKey<CreateCoverageFormData>

export type CreateCoverageFormVal = FormVal<CreateCoverageFormData>

export const INITIAL_CREATE_COVERAGE_FORM_DATA: CreateCoverageFormData = {
  code: ''
}

export type CreateCoverageFormErrors =
  FormValidatorErrors<CreateCoverageFormData>

export type CreateCoverageFormErrorsJoined =
  FormValidatorErrorsJoined<CreateCoverageFormData>

export const createCoverageFormValidator =
  new FormValidator<CreateCoverageFormData>({
    oneField: {
      code: {
        transforms: ['TRIM'],
        rules: ['NOT_EMPTY_STR', 'CODE']
      },
      name: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
        rules: ['ALLOW_UNDEFINED', 'NAME']
      },
      requirementId: {
        transforms: ['EMPTY_STR_TO_UNDEFINED'],
        rules: ['NOT_UNDEFINED']
      },
      type: {
        transforms: ['EMPTY_STR_TO_UNDEFINED'],
        rules: ['NOT_UNDEFINED']
      },
      testIds: {
        transforms: ['EMPTY_ARR_TO_UNDEFINED']
      },
      coveragePercent: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED', 'STR_TO_NUM'],
        rules: ['NOT_UNDEFINED', 'PERCENT']
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
