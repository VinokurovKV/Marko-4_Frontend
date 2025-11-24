// Project
import type { SetupSuccessResultDto } from '@common/dtos/server-api/common.dto'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import {
  type SetupFormData,
  INITIAL_SETUP_FORM_DATA,
  setupFormValidator
} from '~/data/forms/setup'
import { useForm, Form } from './common/form'
import { FormBlock } from './common/form-block'
import { FormPassField } from './common/form-pass-field'
import { FormTextField } from './common/form-text-field'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'

const SETUP_FORM_PROPS_JOINED = setupFormValidator.getPromptsJoined()

export function SetupForm() {
  const navigate = useNavigate()
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: SetupFormData) => {
      return await serverConnector.setup({
        ownerLogin: validatedData.ownerLogin,
        ownerPass: validatedData.ownerPass
      })
    },
    []
  )

  const onSuccessSubmit = React.useCallback(() => {
    notifier.showSuccess('система инициализирована')
    void navigate('/login')
  }, [])

  const { formInternal, data, errors, handleTextFieldChange } = useForm<
    SetupFormData,
    SetupSuccessResultDto
  >({
    INITIAL_FORM_DATA: INITIAL_SETUP_FORM_DATA,
    validator: setupFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  return (
    <Form
      formInternal={formInternal}
      title="инициализация системы"
      submitButtonLabel="инициализировать"
    >
      <FormBlock title="владелец">
        <FormTextField
          required
          name="ownerLogin"
          label="логин"
          value={data.ownerLogin}
          helperText={
            errors?.ownerLogin ?? SETUP_FORM_PROPS_JOINED.ownerLogin ?? ' '
          }
          error={!!errors?.ownerLogin}
          onChange={handleTextFieldChange}
        />
        <FormPassField
          required
          name="ownerPass"
          label="пароль"
          value={data.ownerPass}
          helperText={
            errors?.ownerPass ?? SETUP_FORM_PROPS_JOINED.ownerPass ?? ' '
          }
          error={!!errors?.ownerPass}
          onChange={handleTextFieldChange}
        />
        <FormPassField
          required
          name="ownerPassConfirm"
          label="подтверждение пароля"
          value={data.ownerPassConfirm}
          helperText={
            errors?.ownerPassConfirm ??
            SETUP_FORM_PROPS_JOINED.ownerPassConfirm ??
            ' '
          }
          error={!!errors?.ownerPassConfirm}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </Form>
  )
}
