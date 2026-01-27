// Project
import type {
  CodeWrapDto,
  DateUndefinedWrapDto,
  DescriptionTextUndefinedWrapDto,
  DocumentTypeUndefinedWrapDto,
  NameUndefinedWrapDto,
  PublicVersionUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
  TagIdsUndefinedWrapDto,
  UrlUndefinedWrapDto
} from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type UpdateDocumentFormData = DtoWithoutEnums<
  CodeWrapDto &
    NameUndefinedWrapDto &
    DocumentTypeUndefinedWrapDto &
    PublicVersionUndefinedWrapDto &
    DescriptionTextUndefinedWrapDto &
    DateUndefinedWrapDto &
    UrlUndefinedWrapDto &
    TagIdsUndefinedWrapDto & {
      tagCodesToCreate?: string[]
    } & RemarkTextUndefinedWrapDto
>

export type UpdateDocumentFormKey = FormKey<UpdateDocumentFormData>

export type UpdateDocumentFormVal = FormVal<UpdateDocumentFormData>

export type UpdateDocumentFormErrors =
  FormValidatorErrors<UpdateDocumentFormData>

export type UpdateDocumentFormErrorsJoined =
  FormValidatorErrorsJoined<UpdateDocumentFormData>

export const updateDocumentFormValidator =
  new FormValidator<UpdateDocumentFormData>({
    oneField: {
      code: {
        transforms: ['TRIM'],
        rules: ['NOT_EMPTY_STR', 'CODE']
      },
      name: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
        rules: ['ALLOW_UNDEFINED', 'NAME']
      },
      type: {
        transforms: ['EMPTY_STR_TO_UNDEFINED'],
        rules: ['NOT_UNDEFINED']
      },
      publicVersion: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
        rules: ['ALLOW_UNDEFINED', 'PUBLIC_VERSION']
      },
      descriptionText: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
        rules: ['ALLOW_UNDEFINED', 'TEXT']
      },
      url: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
        rules: ['ALLOW_UNDEFINED', 'URL']
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
