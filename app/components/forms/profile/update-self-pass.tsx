// Project
import type { UpdateUserPassSuccessResultDto } from '@common/dtos/server-api/users.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { ServerConnectorBadRequestError } from '~/server-connector/error'
import { useNotifier } from '~/providers/notifier'
import {
  type UpdateSelfPassFormData,
  INITIAL_UPDATE_SELF_PASS_FORM_DATA,
  updateSelfPassFormValidator
} from '~/data/forms/profile/update-self-pass'
import { useForm, FormBlock, FormDialog, FormPassField } from '../common'
// React
import * as React from 'react'

const UPDATE_SELF_PASS_FORM_PROPS_JOINED =
  updateSelfPassFormValidator.getPromptsJoined()

function badRequestIsAboutIncorrectCurrentPass(error: unknown) {
  if (error instanceof ServerConnectorBadRequestError === false) {
    return false
  }

  const object = error.object as
    | {
        message?: string | string[]
        errorReasons?: { type?: string }[]
      }
    | undefined

  const messages =
    typeof object?.message === 'string'
      ? [object.message]
      : Array.isArray(object?.message)
        ? object.message
        : []

  return (
    messages.includes('Incorrect current pass') ||
    object?.errorReasons?.some(
      (reason) => reason?.type === 'Incorrect current pass'
    ) === true
  )
}

export interface UpdateSelfPassFormDialogProps {
  isActive: boolean
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>
  userId: number | null
}

export function UpdateSelfPassFormDialog(props: UpdateSelfPassFormDialogProps) {
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: UpdateSelfPassFormData) => {
      if (props.userId === null) {
        throw new Error('отсутствует идентификатор пользователя')
      }
      try {
        return await serverConnector.updateUserPass({
          userId: props.userId,
          myCurrentPass: validatedData.myCurrentPass,
          newPass: validatedData.newPass
        })
      } catch (error) {
        if (badRequestIsAboutIncorrectCurrentPass(error)) {
          throw new Error('текущий пароль указан неверно')
        }
        throw error
      }
    },
    [props.userId]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateSelfPassFormData,
      updateUserPassResult: DtoWithoutEnums<UpdateUserPassSuccessResultDto>
    ) => {
      notifier.showSuccess('пароль изменен')
      props.setIsActive(false)
      return updateUserPassResult
    },
    [notifier, props]
  )

  const { formInternal, data, errors, handleTextFieldChange } = useForm<
    UpdateSelfPassFormData,
    DtoWithoutEnums<UpdateUserPassSuccessResultDto>
  >({
    INITIAL_FORM_DATA: INITIAL_UPDATE_SELF_PASS_FORM_DATA,
    validator: updateSelfPassFormValidator,
    clearTrigger: props.userId ?? undefined,
    submitAction,
    onSuccessSubmit
  })

  return (
    <FormDialog
      formInternal={formInternal}
      title="изменить пароль"
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: () => {
          props.setIsActive(false)
        }
      }}
      clearButton={{
        title: 'очистить'
      }}
      isActive={props.isActive}
      setIsActive={props.setIsActive}
    >
      <FormBlock title="безопасность">
        <FormPassField
          required
          name="myCurrentPass"
          label="текущий пароль"
          value={data.myCurrentPass}
          helperText={
            errors?.myCurrentPass ??
            UPDATE_SELF_PASS_FORM_PROPS_JOINED.myCurrentPass ??
            ' '
          }
          error={!!errors?.myCurrentPass}
          onChange={handleTextFieldChange}
        />
        <FormPassField
          required
          name="newPass"
          label="новый пароль"
          value={data.newPass}
          helperText={
            errors?.newPass ?? UPDATE_SELF_PASS_FORM_PROPS_JOINED.newPass ?? ' '
          }
          error={!!errors?.newPass}
          onChange={handleTextFieldChange}
        />
        <FormPassField
          required
          name="newPassConfirm"
          label="подтверждение пароля"
          value={data.newPassConfirm}
          helperText={
            errors?.newPassConfirm ??
            UPDATE_SELF_PASS_FORM_PROPS_JOINED.newPassConfirm ??
            ' '
          }
          error={!!errors?.newPassConfirm}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
