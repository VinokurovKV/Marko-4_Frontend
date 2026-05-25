// Project
import type { BackupSuccessResultDto } from '@common/dtos/server-api/backup'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import {
  type CreateBackupFormData,
  INITIAL_CREATE_BACKUP_FORM_DATA,
  createBackupFormValidator
} from '~/data/forms/resources/create-backup'
import { useForm, FormBlock, FormDialog, FormTextField } from '../common'
// React
import * as React from 'react'

export interface CreateBackupFormDialogProps {
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateBackup?: (result: BackupSuccessResultDto) => void
  onCancelClick?: () => void
}

export function CreateBackupFormDialog(props: CreateBackupFormDialogProps) {
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: CreateBackupFormData) => {
      return await serverConnector.createBackup(validatedData)
    },
    []
  )

  const onSuccessSubmit = React.useCallback(
    (_: CreateBackupFormData, result: BackupSuccessResultDto) => {
      notifier.showSuccess(`бэкап «${result.backupName}» создан`)
      props.onSuccessCreateBackup?.(result)
    },
    [props.onSuccessCreateBackup, notifier]
  )

  const { formInternal, data, handleTextFieldChange } = useForm<
    CreateBackupFormData,
    BackupSuccessResultDto
  >({
    INITIAL_FORM_DATA: INITIAL_CREATE_BACKUP_FORM_DATA,
    validator: createBackupFormValidator,
    submitAction,
    onSuccessSubmit
  })

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать бэкап"
      submitButtonTitle="создать"
      cancelButton={{ title: 'отменить', onClick: props.onCancelClick }}
      clearButton={{ title: 'очистить' }}
      isActive={props.createModeIsActive}
      setIsActive={props.setCreateModeIsActive}
    >
      <FormBlock title="параметры">
        <FormTextField
          name="backupName"
          label="название (необязательно)"
          value={data.backupName ?? ''}
          helperText="если оставить пустым, имя будет сгенерировано автоматически"
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
