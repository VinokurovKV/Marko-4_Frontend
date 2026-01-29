// Project
import type {
  CodeWrapDto,
  DescriptionTextUndefinedWrapDto,
  NameUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
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

export type UpdateTestTemplateFormData = DtoWithoutEnums<
  CodeWrapDto &
    NameUndefinedWrapDto & {
      config?: File
    } & DescriptionTextUndefinedWrapDto &
    TagIdsUndefinedWrapDto & {
      tagCodesToCreate?: string[]
    } & RemarkTextUndefinedWrapDto
>

export type UpdateTestTemplateFormKey = FormKey<UpdateTestTemplateFormData>

export type UpdateTestTemplateFormVal = FormVal<UpdateTestTemplateFormData>

export type UpdateTestTemplateFormErrors =
  FormValidatorErrors<UpdateTestTemplateFormData>

export type UpdateTestTemplateFormErrorsJoined =
  FormValidatorErrorsJoined<UpdateTestTemplateFormData>

export const updateTestTemplateFormValidator =
  new FormValidator<UpdateTestTemplateFormData>({
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
