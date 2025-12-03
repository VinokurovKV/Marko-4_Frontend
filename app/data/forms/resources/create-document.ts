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
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type CreateDocumentFormData = CodeWrapDto &
  NameUndefinedWrapDto &
  DocumentTypeUndefinedWrapDto & {
    config?: File
  } & PublicVersionUndefinedWrapDto &
  DescriptionTextUndefinedWrapDto &
  DateUndefinedWrapDto &
  UrlUndefinedWrapDto &
  TagIdsUndefinedWrapDto & {
    tagCodesToCreate?: string[]
  } & RemarkTextUndefinedWrapDto

export type CreateDocumentFormKey = FormKey<CreateDocumentFormData>

export type CreateDocumentFormVal = FormVal<CreateDocumentFormData>

export const INITIAL_CREATE_DOCUMENT_FORM_DATA: CreateDocumentFormData = {
  code: ''
}

export type CreateDocumentFormErrors =
  FormValidatorErrors<CreateDocumentFormData>

export type CreateDocumentFormErrorsJoined =
  FormValidatorErrorsJoined<CreateDocumentFormData>

export const createDocumentFormValidator =
  new FormValidator<CreateDocumentFormData>({
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
      config: {
        rules: ['NOT_UNDEFINED', 'PDF_EXT']
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
