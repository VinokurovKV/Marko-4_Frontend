// Project
import type { ReadRolesWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/roles.dto'
import type { CreateUserSuccessResultDto } from '@common/dtos/server-api/users.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import {
  type CreateUserFormData,
  INITIAL_CREATE_USER_FORM_DATA,
  createUserFormValidator
} from '~/data/forms/resources/create-user'
import type { FormSelectProps } from '../common'
import {
  useForm,
  FormBlock,
  FormDialog,
  FormEmailField,
  FormMultilineTextField,
  FormPassField,
  FormSelect,
  FormTelField,
  FormTextField
} from '../common'
// React
import * as React from 'react'

type Role = DtoWithoutEnums<ReadRolesWithPrimaryPropsSuccessResultItemDto>

const CREATE_USER_FORM_PROPS_JOINED = createUserFormValidator.getPromptsJoined()

export interface CreateUserFormDialogProps {
  roles: Role[] | null
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateUser?: (createUserResult: CreateUserSuccessResultDto) => void
  onCancelClick?: () => void
}

export function CreateUserFormDialog(props: CreateUserFormDialogProps) {
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: CreateUserFormData) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passConfirm, descriptionText, ...truncatedData } = validatedData
      return await serverConnector.createUser({
        ...truncatedData,
        roleId: truncatedData.roleId!,
        description:
          descriptionText !== undefined
            ? {
                format: 'PLAIN',
                text: descriptionText
              }
            : undefined
      })
    },
    []
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateUserFormData,
      createUserResult: CreateUserSuccessResultDto
    ) => {
      notifier.showSuccess(`пользователь '${data.login}' создан`)
      props.onSuccessCreateUser?.(createUserResult)
    },
    [props.onSuccessCreateUser, notifier]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleNumSelectChange
  } = useForm<CreateUserFormData, CreateUserSuccessResultDto>({
    INITIAL_FORM_DATA: INITIAL_CREATE_USER_FORM_DATA,
    validator: createUserFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const roleSelectItems: FormSelectProps<number>['items'] = React.useMemo(
    () =>
      props.roles?.map((role) => ({
        value: role.id,
        title: role.name
      })) ?? [],
    [props.roles]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать пользователя"
      submitButtonLabel="создать"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'очистить'
      }}
      createModeIsActive={props.createModeIsActive}
      setCreateModeIsActive={props.setCreateModeIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="login"
          label="логин"
          value={data.login}
          helperText={
            errors?.login ?? CREATE_USER_FORM_PROPS_JOINED.login ?? ' '
          }
          error={!!errors?.login}
          onChange={handleTextFieldChange}
        />
        <FormPassField
          required
          name="pass"
          label="пароль"
          value={data.pass}
          helperText={errors?.pass ?? CREATE_USER_FORM_PROPS_JOINED.pass ?? ' '}
          error={!!errors?.pass}
          onChange={handleTextFieldChange}
        />
        <FormPassField
          required
          name="passConfirm"
          label="подтверждение пароля"
          value={data.passConfirm}
          helperText={
            errors?.passConfirm ??
            CREATE_USER_FORM_PROPS_JOINED.passConfirm ??
            ' '
          }
          error={!!errors?.passConfirm}
          onChange={handleTextFieldChange}
        />
        <FormSelect
          required
          name="roleId"
          label="роль"
          items={roleSelectItems}
          value={data.roleId ?? ''}
          helperText={
            errors?.roleId ?? CREATE_USER_FORM_PROPS_JOINED.roleId ?? ' '
          }
          error={!!errors?.roleId}
          onChange={handleNumSelectChange}
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormTextField
          name="surname"
          label="фамилия"
          value={data.surname ?? ''}
          helperText={
            errors?.surname ?? CREATE_USER_FORM_PROPS_JOINED.surname ?? ' '
          }
          error={!!errors?.surname}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="forename"
          label="имя"
          value={data.forename ?? ''}
          helperText={
            errors?.forename ?? CREATE_USER_FORM_PROPS_JOINED.forename ?? ' '
          }
          error={!!errors?.forename}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="patronymic"
          label="отчество"
          value={data.patronymic ?? ''}
          helperText={
            errors?.patronymic ??
            CREATE_USER_FORM_PROPS_JOINED.patronymic ??
            ' '
          }
          error={!!errors?.patronymic}
          onChange={handleTextFieldChange}
        />
        <FormTelField
          name="phone"
          label="телефон"
          value={data.phone ?? ''}
          helperText={
            errors?.phone ?? CREATE_USER_FORM_PROPS_JOINED.phone ?? ' '
          }
          error={!!errors?.phone}
          onChange={handleTextFieldChange}
        />
        <FormEmailField
          name="email"
          label="e-mail"
          value={data.email ?? ''}
          helperText={
            errors?.email ?? CREATE_USER_FORM_PROPS_JOINED.email ?? ' '
          }
          error={!!errors?.email}
          onChange={handleTextFieldChange}
        />
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            CREATE_USER_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
