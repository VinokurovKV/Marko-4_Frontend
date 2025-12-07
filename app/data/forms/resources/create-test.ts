// Project
import type {
  BigCodeWrapDto,
  DescriptionTextUndefinedWrapDto,
  SubgroupIdUndefinedWrapDto,
  BigNameUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
  NumInSubgroupUndefinedWrapDto,
  CoverageIdsUndefinedWrapDto,
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

export type CreateTestFormDataWithoutVertexes = DtoWithoutEnums<
  BigCodeWrapDto &
    BigNameUndefinedWrapDto &
    SubgroupIdUndefinedWrapDto &
    NumInSubgroupUndefinedWrapDto &
    CoverageIdsUndefinedWrapDto &
    TestTemplateIdUndefinedWrapDto & {
      config?: File
    } & TopologyIdUndefinedWrapDto &
    DescriptionTextUndefinedWrapDto &
    TagIdsUndefinedWrapDto & {
      tagCodesToCreate?: string[]
    } & RemarkTextUndefinedWrapDto
>

export type CreateTestFormData = CreateTestFormDataWithoutVertexes & {
  [index: string]: any
}

export function getDbcIdField(index: number) {
  return `dbcId_${index}`
}

export function getDeltaField(index: number) {
  return `delta_${index}`
}

export type CreateTestFormKey = FormKey<CreateTestFormData>

export type CreateTestFormVal = FormVal<CreateTestFormData>

export const INITIAL_CREATE_TEST_FORM_DATA: CreateTestFormData = {
  code: ''
}

export type CreateTestFormErrors = FormValidatorErrors<CreateTestFormData>

export type CreateTestFormErrorsJoined =
  FormValidatorErrorsJoined<CreateTestFormData>

const formValidatorConfig: FormValidatorConfig<CreateTestFormData> = {
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
    coverageIds: {
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

export const createTestFormValidator = new FormValidator<CreateTestFormData>(
  formValidatorConfig
)
