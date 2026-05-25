import type { CreateBackupQueryDto } from '@common/dtos/server-api/backup'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  type FormKey,
  type FormVal,
  type FormValidatorErrors,
  type FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'

export type CreateBackupFormData = DtoWithoutEnums<CreateBackupQueryDto>

export type CreateBackupFormKey = FormKey<CreateBackupFormData>

export type CreateBackupFormVal = FormVal<CreateBackupFormData>

export const INITIAL_CREATE_BACKUP_FORM_DATA: CreateBackupFormData = {}

export type CreateBackupFormErrors = FormValidatorErrors<CreateBackupFormData>

export type CreateBackupFormErrorsJoined =
  FormValidatorErrorsJoined<CreateBackupFormData>

export const createBackupFormValidator =
  new FormValidator<CreateBackupFormData>({
    oneField: {
      backupName: {
        transforms: ['TRIM', 'EMPTY_STR_TO_UNDEFINED']
      }
    }
  })
