// Project
import type {
  CodeWrapDto,
  DescriptionTextUndefinedWrapDto,
  NameUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
  TagIdsUndefinedWrapDto
} from '@common/dtos'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type CreateTestTemplateFormData = CodeWrapDto &
  NameUndefinedWrapDto & {
    config?: File
  } & DescriptionTextUndefinedWrapDto &
  TagIdsUndefinedWrapDto & {
    tagCodesToCreate?: string[]
  } & RemarkTextUndefinedWrapDto

export type CreateTestTemplateFormKey = FormKey<CreateTestTemplateFormData>

export type CreateTestTemplateFormVal = FormVal<CreateTestTemplateFormData>

export const INITIAL_CREATE_TEST_TEMPLATE_FORM_DATA: CreateTestTemplateFormData =
  {
    code: ''
  }

export type CreateTestTemplateFormErrors =
  FormValidatorErrors<CreateTestTemplateFormData>

export type CreateTestTemplateFormErrorsJoined =
  FormValidatorErrorsJoined<CreateTestTemplateFormData>

export const createTestTemplateFormValidator =
  new FormValidator<CreateTestTemplateFormData>({
    oneField: {
      code: {
        transforms: ['TRIM'],
        rules: ['NOT_EMPTY_STR', 'CODE']
      },
      name: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
        rules: ['ALLOW_UNDEFINED', 'NAME']
      },
      config: {
        rules: ['ALLOW_UNDEFINED', 'ZIP_EXT']
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
