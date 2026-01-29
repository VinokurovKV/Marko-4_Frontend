// Project
import type {
  BigCodeWrapDto,
  DescriptionTextUndefinedWrapDto,
  SubgroupIdUndefinedWrapDto,
  BigNameUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
  NumInSubgroupUndefinedWrapDto,
  RequirementIdsUndefinedWrapDto,
  TopologyIdUndefinedWrapDto,
  TestTemplateIdUndefinedWrapDto,
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

export const MAX_VERTEXES_IN_TOPOLOGY = 30

export type UpdateTestFormDataWithoutVertexes = DtoWithoutEnums<
  BigCodeWrapDto &
    BigNameUndefinedWrapDto &
    SubgroupIdUndefinedWrapDto &
    NumInSubgroupUndefinedWrapDto &
    RequirementIdsUndefinedWrapDto &
    TestTemplateIdUndefinedWrapDto & {
      config?: File
    } & TopologyIdUndefinedWrapDto &
    DescriptionTextUndefinedWrapDto &
    TagIdsUndefinedWrapDto & {
      tagCodesToCreate?: string[]
    } & RemarkTextUndefinedWrapDto
>

export type UpdateTestFormData = UpdateTestFormDataWithoutVertexes & {
  [index: string]: any
}

export function getDbcIdField(index: number) {
  return `dbcId_${index}`
}

export function getDeltaField(index: number) {
  return `delta_${index}`
}

export type UpdateTestFormKey = FormKey<UpdateTestFormData>

export type UpdateTestFormVal = FormVal<UpdateTestFormData>

export type UpdateTestFormErrors = FormValidatorErrors<UpdateTestFormData>

export type UpdateTestFormErrorsJoined =
  FormValidatorErrorsJoined<UpdateTestFormData>

const formValidatorConfig: FormValidatorConfig<UpdateTestFormData> = {
  oneField: {
    code: {
      transforms: ['TRIM'],
      rules: ['NOT_EMPTY_STR', 'BIG_CODE']
    },
    name: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'BIG_NAME']
    },
    subgroupId: {
      transforms: ['EMPTY_STR_TO_UNDEFINED']
    },
    numInSubgroup: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED', 'STR_TO_NUM'],
      rules: ['ALLOW_UNDEFINED', 'INT_NON_NEGATIVE']
    },
    requirementIds: {
      transforms: ['EMPTY_ARR_TO_UNDEFINED']
    },
    testTemplateId: {
      transforms: ['EMPTY_STR_TO_UNDEFINED']
    },
    config: {
      rules: ['ALLOW_UNDEFINED', 'ZIP_EXT']
    },
    topologyId: {
      transforms: ['EMPTY_STR_TO_UNDEFINED'],
      rules: ['NOT_UNDEFINED']
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

for (let index = 0; index < MAX_VERTEXES_IN_TOPOLOGY; index++) {
  formValidatorConfig.oneField![getDbcIdField(index)] = {
    transforms: ['EMPTY_STR_TO_UNDEFINED']
  }
  formValidatorConfig.oneField![getDeltaField(index)] = {
    rules: ['ALLOW_UNDEFINED', 'ZIP_EXT']
  }
}

export const updateTestFormValidator = new FormValidator<UpdateTestFormData>(
  formValidatorConfig
)
