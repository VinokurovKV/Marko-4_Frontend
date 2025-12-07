// Project
import type {
  CodeWrapDto,
  DescriptionTextUndefinedWrapDto,
  NameUndefinedWrapDto,
  NumUndefinedWrapDto,
  RemarkTextUndefinedWrapDto,
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
export const MAX_LINKS_IN_COMMON_TOPOLOGY = 100

export type CreateCommonTopologyFormDataWithoutConfig = DtoWithoutEnums<
  CodeWrapDto &
    NameUndefinedWrapDto &
    NumUndefinedWrapDto & {
      vertexesCount: number
      linksCount: number
    } & DescriptionTextUndefinedWrapDto &
    TagIdsUndefinedWrapDto & {
      tagCodesToCreate?: string[]
    } & RemarkTextUndefinedWrapDto
>

export type CreateCommonTopologyFormData =
  CreateCommonTopologyFormDataWithoutConfig & {
    [index: string]: any
  }

export function getVertexIdField(vertexIndex: number) {
  return `vertexId_${vertexIndex}`
}

let lastUsedVertexId = -1

export function getUniqueVertexId() {
  lastUsedVertexId++
  return lastUsedVertexId
}

export function getVertexNameField(vertexIndex: number) {
  return `vertexName_${vertexIndex}`
}

export function getVertexIsGeneratorField(vertexIndex: number) {
  return `vertexIsGenerator_${vertexIndex}`
}

export function getVertexIfaceNamesField(vertexIndex: number) {
  return `vertexIfaceNames_${vertexIndex}`
}

export function getLinkIdField(linkIndex: number) {
  return `linkId_${linkIndex}`
}

let lastUsedLinkId = -1

export function getUniqueLinkId() {
  lastUsedLinkId++
  return lastUsedLinkId
}

export function getStartVertexIfacePairField(linkIndex: number) {
  return `startVertexIfacePair_${linkIndex}`
}

export function getEndVertexIfacePairField(linkIndex: number) {
  return `endVertexIfacePair_${linkIndex}`
}

export type CreateCommonTopologyFormKey = FormKey<CreateCommonTopologyFormData>

export type CreateCommonTopologyFormVal = FormVal<CreateCommonTopologyFormData>

export const INITIAL_CREATE_COMMON_TOPOLOGY_FORM_DATA: CreateCommonTopologyFormData =
  {
    code: '',
    vertexesCount: 0,
    linksCount: 0
  }

export type CreateCommonTopologyFormErrors =
  FormValidatorErrors<CreateCommonTopologyFormData>

export type CreateCommonTopologyFormErrorsJoined =
  FormValidatorErrorsJoined<CreateCommonTopologyFormData>

const formValidatorConfig: FormValidatorConfig<CreateCommonTopologyFormData> = {
  oneField: {
    code: {
      transforms: ['TRIM'],
      rules: ['NOT_EMPTY_STR', 'CODE']
    },
    name: {
      transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED'],
      rules: ['ALLOW_UNDEFINED', 'NAME']
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
      rules: ['AUTOCOMPLETE_FREE_ITEMS'],
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
}

for (
  let vertexIndex = 0;
  vertexIndex < MAX_VERTEXES_IN_COMMON_TOPOLOGY;
  vertexIndex++
) {
  formValidatorConfig.oneField![getVertexNameField(vertexIndex)] = {
    transforms: ['TRIM'],
    rules: ['NOT_EMPTY_STR', 'VERTEX_NAME']
  }
  formValidatorConfig.oneField![getVertexIfaceNamesField(vertexIndex)] = {
    rules: ['AUTOCOMPLETE_FREE_ITEMS']
  }
}

for (let linkIndex = 0; linkIndex < MAX_LINKS_IN_COMMON_TOPOLOGY; linkIndex++) {
  formValidatorConfig.oneField![getStartVertexIfacePairField(linkIndex)] = {
    transforms: ['EMPTY_STR_TO_UNDEFINED'],
    rules: ['NOT_UNDEFINED']
  }
  formValidatorConfig.oneField![getEndVertexIfacePairField(linkIndex)] = {
    transforms: ['EMPTY_STR_TO_UNDEFINED'],
    rules: ['NOT_UNDEFINED']
  }
}

export const createCommonTopologyFormValidator =
  new FormValidator<CreateCommonTopologyFormData>(formValidatorConfig)
