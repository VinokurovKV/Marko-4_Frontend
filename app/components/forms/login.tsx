// Project
import type { LoginSuccessResultDto } from '@common/dtos/server-api/auth.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import {
  type LoginFormData,
  INITIAL_LOGIN_FORM_DATA,
  loginFormValidator
} from '~/data/forms/login'
import { useForm, Form } from './common/form'
import { FormPassField } from './common/form-pass-field'
import { FormTextField } from './common/form-text-field'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'

type LoginSuccessResult = Pick<
  DtoWithoutEnums<LoginSuccessResultDto>,
  'userId' | 'rights'
>

export function LoginForm() {
  const navigate = useNavigate()
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: LoginFormData) => {
      return await serverConnector.login({
        login: validatedData.login,
        pass: validatedData.pass
      })
    },
    [navigate]
  )

  const onSuccessSubmit = React.useCallback(() => {
    notifier.showSuccess('выполнен вход в систему')
    void navigate('/')
  }, [navigate])

  const { formInternal, data, errors, handleTextFieldChange } = useForm<
    LoginFormData,
    LoginSuccessResult
  >({
    INITIAL_FORM_DATA: INITIAL_LOGIN_FORM_DATA,
    validator: loginFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  return (
    <Form formInternal={formInternal} title="вход" submitButtonTitle="войти">
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
