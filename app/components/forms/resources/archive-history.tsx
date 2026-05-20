// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import {
  type ArchiveHistoryFormData,
  INITIAL_ARCHIVE_HISTORY_FORM_DATA,
  archiveHistoryFormValidator
} from '~/data/forms/resources/archive-history'
import { useForm, FormBlock, FormDateTime, FormDialog } from '../common'
// React
import * as React from 'react'

const ARCHIVE_HISTORY_FORM_PROPS_JOINED =
  archiveHistoryFormValidator.getPromptsJoined()

export interface ArchiveHistoryFormDialogProps {
  archiveModeIsActive: boolean
  setArchiveModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessArchiveHistory?: () => void
  onCancelClick?: () => void
}

export function ArchiveHistoryFormDialog(props: ArchiveHistoryFormDialogProps) {
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: ArchiveHistoryFormData) => {
      try {
        await serverConnector.archiveHistory({
          maxArchiveTime: validatedData.maxArchiveTime
        })
        notifier.showSuccess('архивирование истории завершено')
      } catch {
        notifier.showWarning('не удалось архивировать историю')
      }
    },
    [notifier]
  )

  const { formInternal, data, errors, handleDateTimeChange } = useForm<
    ArchiveHistoryFormData,
    void
  >({
    INITIAL_FORM_DATA: INITIAL_ARCHIVE_HISTORY_FORM_DATA,
    validator: archiveHistoryFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: props.onSuccessArchiveHistory
  })

  return (
    <FormDialog
      formInternal={formInternal}
      title="архивировать историю"
      submitButtonTitle="архивировать"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'очистить'
      }}
      isActive={props.archiveModeIsActive}
      setIsActive={props.setArchiveModeIsActive}
    >
      <FormBlock>
        <FormDateTime
          disableFuture
          name="maxArchiveTime"
          label="верхняя граница времени архивируемой истории"
          value={data.maxArchiveTime ?? null}
          helperText={
            errors?.maxArchiveTime ??
            ARCHIVE_HISTORY_FORM_PROPS_JOINED.maxArchiveTime ??
            ' '
          }
          error={!!errors?.maxArchiveTime}
          onChange={handleDateTimeChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
