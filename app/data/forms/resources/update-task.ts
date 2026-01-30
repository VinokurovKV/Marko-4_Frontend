// Project
import type {
  DescriptionTextUndefinedWrapDto,
  NameUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
  MinLaunchTimeUndefinedWrapDto,
  PriorityUndefinedWrapDto,
  TagIdsUndefinedWrapDto
} from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  type FormKey,
  type FormVal,
  type FormValidatorConfig,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type UpdateTaskFormData = DtoWithoutEnums<
  NameUndefinedWrapDto &
    PriorityUndefinedWrapDto &
    MinLaunchTimeUndefinedWrapDto &
    DescriptionTextUndefinedWrapDto &
    TagIdsUndefinedWrapDto & {
      tagCodesToCreate?: string[]
    } & RemarkTextUndefinedWrapDto
>

export type UpdateTaskFormKey = FormKey<UpdateTaskFormData>

export type UpdateTaskFormVal = FormVal<UpdateTaskFormData>

export type UpdateTaskFormErrors = FormValidatorErrors<UpdateTaskFormData>

export type UpdateTaskFormErrorsJoined =
  FormValidatorErrorsJoined<UpdateTaskFormData>

const formValidatorConfig: FormValidatorConfig<UpdateTaskFormData> = {
  oneField: {
    name: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'NAME']
    },
    priority: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED', 'STR_TO_NUM'],
      rules: ['NOT_UNDEFINED', 'INT_NON_NEGATIVE', 'PRIORITY']
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
}

export const updateTaskFormValidator = new FormValidator<UpdateTaskFormData>(
  formValidatorConfig
)
