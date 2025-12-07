// Project
import type {
  BigCodeWrapDto,
  BigNameUndefinedWrapDto,
  DescriptionTextUndefinedWrapDto,
  NumUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
  SubgroupIdsUndefinedWrapDto,
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

export type CreateGroupFormData = DtoWithoutEnums<
  BigCodeWrapDto &
    BigNameUndefinedWrapDto &
    SubgroupIdsUndefinedWrapDto &
    NumUndefinedWrapDto &
    DescriptionTextUndefinedWrapDto &
    TagIdsUndefinedWrapDto & {
      tagCodesToCreate?: string[]
    } & RemarkTextUndefinedWrapDto
>

export type CreateGroupFormKey = FormKey<CreateGroupFormData>

export type CreateGroupFormVal = FormVal<CreateGroupFormData>

export const INITIAL_CREATE_GROUP_FORM_DATA: CreateGroupFormData = {
  code: ''
}

export type CreateGroupFormErrors = FormValidatorErrors<CreateGroupFormData>

export type CreateGroupFormErrorsJoined =
  FormValidatorErrorsJoined<CreateGroupFormData>

export const createGroupFormValidator = new FormValidator<CreateGroupFormData>({
  oneField: {
    code: {
      transforms: ['TRIM'],
      rules: ['NOT_EMPTY_STR', 'BIG_CODE']
    },
    name: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'BIG_NAME']
    },
    subgroupIds: {
      transforms: ['EMPTY_ARR_TO_UNDEFINED']
    },
    num: {
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
