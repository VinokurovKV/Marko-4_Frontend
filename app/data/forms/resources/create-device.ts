// Project
import type {
  CodeWrapDto,
  DescriptionTextUndefinedWrapDto,
  DeviceTypeUndefinedWrapDto,
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

export type CreateDeviceFormData = CodeWrapDto &
  DeviceTypeUndefinedWrapDto &
  NameUndefinedWrapDto & {
    config?: File
  } & {
    clearConfig?: File
  } & {
    accessConfig?: File
  } & DescriptionTextUndefinedWrapDto &
  TagIdsUndefinedWrapDto & {
    tagCodesToCreate?: string[]
  } & RemarkTextUndefinedWrapDto

export type CreateDeviceFormKey = FormKey<CreateDeviceFormData>

export type CreateDeviceFormVal = FormVal<CreateDeviceFormData>

export const INITIAL_CREATE_DEVICE_FORM_DATA: CreateDeviceFormData = {
  code: ''
}

export type CreateDeviceFormErrors = FormValidatorErrors<CreateDeviceFormData>

export type CreateDeviceFormErrorsJoined =
  FormValidatorErrorsJoined<CreateDeviceFormData>

export const createDeviceFormValidator =
  new FormValidator<CreateDeviceFormData>({
    oneField: {
      code: {
        transforms: ['TRIM'],
        rules: ['NOT_EMPTY_STR', 'CODE']
      },
      type: {
        transforms: ['EMPTY_STR_TO_UNDEFINED'],
        rules: ['NOT_UNDEFINED']
      },
      name: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
        rules: ['ALLOW_UNDEFINED', 'NAME']
      },
      config: {
        rules: ['ALLOW_UNDEFINED', 'ZIP_EXT']
      },
      clearConfig: {
        rules: ['ALLOW_UNDEFINED', 'ZIP_EXT']
      },
      accessConfig: {
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
        transforms: ['EMPTY_ARR_TO_UNDEFINED']
      },
      remarkText: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
        rules: ['ALLOW_UNDEFINED', 'TEXT']
      }
    }
  })
