// Project
import type { CreateTagSuccessResultDto } from '@common/dtos/server-api/tags.dto'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import {
  type CreateTagFormData,
  INITIAL_CREATE_TAG_FORM_DATA,
  createTagFormValidator
} from '~/data/forms/resources/create-tag'
import {
  useForm,
  FormBlock,
  FormDialog,
  FormMultilineTextField,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const CREATE_TAG_FORM_PROPS_JOINED = createTagFormValidator.getPromptsJoined()

export interface CreateTagFormDialogProps {
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateTag?: (createTagResult: CreateTagSuccessResultDto) => void
  onCancelClick?: () => void
}

export function CreateTagFormDialog(props: CreateTagFormDialogProps) {
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: CreateTagFormData) => {
      return await serverConnector.createTag({
        code: validatedData.code,
        description:
          validatedData.descriptionText !== undefined
            ? {
                format: 'PLAIN',
                text: validatedData.descriptionText
              }
            : undefined
      })
    },
    []
  )

  const onSuccessSubmit = React.useCallback(
    (data: CreateTagFormData, createTagResult: CreateTagSuccessResultDto) => {
      notifier.showSuccess(`тег '${data.code}' создан`)
      props.onSuccessCreateTag?.(createTagResult)
    },
    [props.onSuccessCreateTag, notifier]
  )

  const { formInternal, data, errors, handleTextFieldChange } = useForm<
    CreateTagFormData,
    CreateTagSuccessResultDto
  >({
    INITIAL_FORM_DATA: INITIAL_CREATE_TAG_FORM_DATA,
    validator: createTagFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать тег"
      submitButtonLabel="создать"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'очистить'
      }}
      isActive={props.createModeIsActive}
      setIsActive={props.setCreateModeIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={errors?.code ?? CREATE_TAG_FORM_PROPS_JOINED.code ?? ' '}
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            CREATE_TAG_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
