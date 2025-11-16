// Project
import type { LoginSuccessResultDto } from '@common/dtos/server-api/auth.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import {
  type LoginFormData,
  INITIAL_LOGIN_FORM_DATA,
  loginFormValidator
} from '~/data/forms/login'
import { useForm, Form } from './common/form'
import { FormPassField } from './common/form-pass-field'
import { FormTextField } from './common/form-text-field'
// React
import * as React from 'react'

type LoginSuccessResult = Pick<
  DtoWithoutEnums<LoginSuccessResultDto>,
  'userId' | 'rights'
>

export interface LoginFormProps {
  onSuccessLogin?: (loginResult: LoginSuccessResult) => void
}

export function LoginForm(props: LoginFormProps) {
  const submitAction = React.useCallback(
    async (validatedData: LoginFormData) => {
      return await serverConnector.login({
        login: validatedData.login,
        pass: validatedData.pass
      })
    },
    []
  )

  const { formInternal, data, errors, handleTextFieldChange } = useForm<
    LoginFormData,
    LoginSuccessResult
  >({
    INITIAL_FORM_DATA: INITIAL_LOGIN_FORM_DATA,
    validator: loginFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: props.onSuccessLogin
  })

  return (
    <Form formInternal={formInternal} title="вход" submitButtonLabel="войти">
      <FormTextField
        required
        name="login"
        label="логин"
        value={data.login}
        helperText={errors?.login ?? ' '}
        error={!!errors?.login}
        onChange={handleTextFieldChange}
      />
      <FormPassField
        required
        name="pass"
        label="пароль"
        value={data.pass}
        helperText={errors?.pass ?? ' '}
        error={!!errors?.pass}
        onChange={handleTextFieldChange}
      />
    </Form>
  )
}
