// Project
import type { MaxArchiveTimeUndefinedWrapDto } from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  type FormKey,
  type FormVal,
  type FormValidatorConfig,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type ArchiveHistoryFormData =
  DtoWithoutEnums<MaxArchiveTimeUndefinedWrapDto>

export type ArchiveHistoryFormKey = FormKey<ArchiveHistoryFormData>

export type ArchiveHistoryFormVal = FormVal<ArchiveHistoryFormData>

export const INITIAL_ARCHIVE_HISTORY_FORM_DATA: ArchiveHistoryFormData = {}

export type ArchiveHistoryFormErrors =
  FormValidatorErrors<ArchiveHistoryFormData>

export type ArchiveHistoryFormErrorsJoined =
  FormValidatorErrorsJoined<ArchiveHistoryFormData>

const formValidatorConfig: FormValidatorConfig<ArchiveHistoryFormData> = {}

export const archiveHistoryFormValidator =
  new FormValidator<ArchiveHistoryFormData>(formValidatorConfig)
