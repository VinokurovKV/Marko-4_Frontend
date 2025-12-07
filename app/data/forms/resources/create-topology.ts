// Project
import type {
  CodeWrapDto,
  CommonTopologyIdUndefinedWrapDto,
  DescriptionTextUndefinedWrapDto,
  NameUndefinedWrapDto,
  NumInCommonTopologyUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
  TagIdsUndefinedWrapDto,
  VertexNamesUndefinedWrapDto
} from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type CreateTopologyFormData = DtoWithoutEnums<
  CodeWrapDto &
    NameUndefinedWrapDto &
    CommonTopologyIdUndefinedWrapDto &
    VertexNamesUndefinedWrapDto &
    NumInCommonTopologyUndefinedWrapDto &
    DescriptionTextUndefinedWrapDto &
    TagIdsUndefinedWrapDto & {
      tagCodesToCreate?: string[]
    } & RemarkTextUndefinedWrapDto
>

export type CreateTopologyFormKey = FormKey<CreateTopologyFormData>

export type CreateTopologyFormVal = FormVal<CreateTopologyFormData>

export const INITIAL_CREATE_TOPOLOGY_FORM_DATA: CreateTopologyFormData = {
  code: ''
}

export type CreateTopologyFormErrors =
  FormValidatorErrors<CreateTopologyFormData>

export type CreateTopologyFormErrorsJoined =
  FormValidatorErrorsJoined<CreateTopologyFormData>

export const createTopologyFormValidator =
  new FormValidator<CreateTopologyFormData>({
    oneField: {
      code: {
        transforms: ['TRIM'],
        rules: ['NOT_EMPTY_STR', 'CODE']
      },
      name: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
        rules: ['ALLOW_UNDEFINED', 'NAME']
      },
      commonTopologyId: {
        transforms: ['EMPTY_STR_TO_UNDEFINED'],
        rules: ['NOT_UNDEFINED']
      },
      vertexNames: {
        transforms: ['EMPTY_ARR_TO_UNDEFINED']
      },
      numInCommonTopology: {
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
