// Project
import type {
  DescriptionTextUndefinedWrapDto,
  TaskModeUndefinedWrapDto,
  NameUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
  CommonTopologyIdUndefinedWrapDto,
  MinLaunchTimeUndefinedWrapDto,
  AbortIfNotPassedUndefinedWrapDto,
  TaskResultsToSaveUndefinedWrapDto,
  WithoutDeviceConfigUndefinedWrapDto,
  PriorityUndefinedWrapDto,
  PausedUndefinedWrapDto,
  TestIdsUndefinedWrapDto,
  SubgroupIdsUndefinedWrapDto,
  GroupIdsUndefinedWrapDto,
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

export const MAX_VERTEXES_IN_COMMON_TOPOLOGY = 30

export type CreateTaskFormDataWithoutVertexes = DtoWithoutEnums<
  NameUndefinedWrapDto &
    TaskModeUndefinedWrapDto &
    CommonTopologyIdUndefinedWrapDto &
    TestIdsUndefinedWrapDto &
    SubgroupIdsUndefinedWrapDto &
    GroupIdsUndefinedWrapDto &
    TaskResultsToSaveUndefinedWrapDto &
    AbortIfNotPassedUndefinedWrapDto &
    WithoutDeviceConfigUndefinedWrapDto &
    PriorityUndefinedWrapDto &
    PausedUndefinedWrapDto &
    MinLaunchTimeUndefinedWrapDto &
    DescriptionTextUndefinedWrapDto &
    TagIdsUndefinedWrapDto & {
      tagCodesToCreate?: string[]
    } & RemarkTextUndefinedWrapDto
>

export type CreateTaskFormData = CreateTaskFormDataWithoutVertexes & {
  [index: string]: any
}

// export function getDsefIdField(index: number) {
//   return `dsefId_${index}`
// }

export function getDeviceIdField(index: number) {
  return `deviceId_${index}`
}

export type CreateTaskFormKey = FormKey<CreateTaskFormData>

export type CreateTaskFormVal = FormVal<CreateTaskFormData>

export const INITIAL_CREATE_TASK_FORM_DATA: CreateTaskFormData = {
  code: ''
}

export type CreateTaskFormErrors = FormValidatorErrors<CreateTaskFormData>

export type CreateTaskFormErrorsJoined =
  FormValidatorErrorsJoined<CreateTaskFormData>

const formValidatorConfig: FormValidatorConfig<CreateTaskFormData> = {
  oneField: {
    name: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'NAME']
    },
    mode: {
      transforms: ['EMPTY_STR_TO_UNDEFINED'],
      rules: ['NOT_UNDEFINED']
    },
    commonTopologyId: {
      transforms: ['EMPTY_STR_TO_UNDEFINED'],
      rules: ['NOT_UNDEFINED']
    },
    testIds: {
      transforms: ['EMPTY_ARR_TO_UNDEFINED']
    },
    subgroupIds: {
      transforms: ['EMPTY_ARR_TO_UNDEFINED']
    },
    groupIds: {
      transforms: ['EMPTY_ARR_TO_UNDEFINED']
    },
    resultsToSave: {
      transforms: ['EMPTY_ARR_TO_UNDEFINED']
    },
    priority: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED', 'STR_TO_NUM'],
      rules: ['ALLOW_UNDEFINED', 'INT_NON_NEGATIVE', 'PRIORITY']
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

for (let index = 0; index < MAX_VERTEXES_IN_COMMON_TOPOLOGY; index++) {
  // formValidatorConfig.oneField![getDsefIdField(index)] = {
  //   transforms: ['EMPTY_STR_TO_UNDEFINED']
  // }
  formValidatorConfig.oneField![getDeviceIdField(index)] = {
    transforms: ['EMPTY_STR_TO_UNDEFINED'],
    rules: ['NOT_UNDEFINED']
  }
}

export const createTaskFormValidator = new FormValidator<CreateTaskFormData>(
  formValidatorConfig
)
